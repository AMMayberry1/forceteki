import { IActionAbilityProps, IConstantAbilityProps, Zone } from '../../Interfaces';
import { ActionAbility } from '../ability/ActionAbility';
import PlayerOrCardAbility from '../ability/PlayerOrCardAbility';
import { OngoingEffectSource } from '../ongoingEffect/OngoingEffectSource';
import type Player from '../Player';
import * as Contract from '../utils/Contract';
import { AbilityRestriction, Aspect, CardType, Duration, EffectName, EventName, KeywordName, ZoneName, MoveZoneDestination, DeckZoneDestination, RelativePlayer, Trait, WildcardZoneName } from '../Constants';
import * as EnumHelpers from '../utils/EnumHelpers';
import { AbilityContext } from '../ability/AbilityContext';
import { CardAbility } from '../ability/CardAbility';
import type Shield from '../../cards/01_SOR/tokens/Shield';
import { KeywordInstance, KeywordWithCostValues } from '../ability/KeywordInstance';
import * as KeywordHelpers from '../ability/KeywordHelpers';
import { StateWatcherRegistrar } from '../stateWatcher/StateWatcherRegistrar';
import type { EventCard } from './EventCard';
import type { CardWithExhaustProperty, CardWithTriggeredAbilities, CardWithConstantAbilities, TokenCard, UnitCard, CardWithDamageProperty, TokenOrPlayableCard } from './CardTypes';
import type { UpgradeCard } from './UpgradeCard';
import type { BaseCard } from './BaseCard';
import type { LeaderCard } from './LeaderCard';
import type { LeaderUnitCard } from './LeaderUnitCard';
import type { NonLeaderUnitCard } from './NonLeaderUnitCard';
import type { PlayableOrDeployableCard } from './baseClasses/PlayableOrDeployableCard';
import type { InPlayCard } from './baseClasses/InPlayCard';
import { v4 as uuidv4 } from 'uuid';
import { IConstantAbility } from '../ongoingEffect/IConstantAbility';

// required for mixins to be based on this class
export type CardConstructor = new (...args: any[]) => Card;

/**
 * The base class for all card types. Any shared properties among all cards will be present here.
 *
 * To access properties / methods of specific subclass types, use check methods such as {@link Card.isUnit}
 * or {@link Card.canBeExhausted} to confirm that the card has the expected properties and then cast
 * to the specific card type or one of the union types in `CardTypes.js` as needed.
 */
export class Card extends OngoingEffectSource {
    public static implemented = false;
    public readonly aspects: Aspect[] = [];
    public readonly internalName: string;
    public readonly subtitle?: string;
    public readonly title: string;
    public readonly unique: boolean;

    protected override readonly id: string;
    protected readonly printedKeywords: KeywordInstance[];
    protected readonly printedTraits: Set<Trait>;
    protected readonly printedType: CardType;

    protected actionAbilities: ActionAbility[] = [];
    protected constantAbilities: IConstantAbility[] = [];
    protected _controller: Player;
    protected _facedown = true;
    protected hasImplementationFile: boolean;   // this will be set by the ability setup methods
    protected hiddenForController = true;      // TODO: is this correct handling of hidden / visible card state? not sure how this integrates with the client
    protected hiddenForOpponent = true;

    private _zone: Zone;
    private nextAbilityIdx = 0;


    // ******************************************** PROPERTY GETTERS ********************************************
    public get controller(): Player {
        return this._controller;
    }

    public get facedown(): boolean {
        return this._facedown;
    }

    public get keywords(): KeywordInstance[] {
        return this.getKeywords();
    }

    /** @deprecated use title instead**/
    public override get name() {
        return super.name;
    }

    public get traits(): Set<Trait> {
        return this.getTraits();
    }

    public get type(): CardType {
        return this.printedType;
    }

    public get zone(): Zone {
        return this._zone;
    }

    protected set zone(zone: Zone) {
        this._zone = zone;
    }

    public get zoneName(): ZoneName {
        return this._zone?.name;
    }

    // *********************************************** CONSTRUCTOR ***********************************************
    public constructor(
        public readonly owner: Player,
        private readonly cardData: any
    ) {
        super(owner.game, cardData.title);

        this.validateCardData(cardData);
        this.validateImplementationId(cardData);

        this.aspects = EnumHelpers.checkConvertToEnum(cardData.aspects, Aspect);
        this.internalName = cardData.internalName;
        this.subtitle = cardData.subtitle;
        this.title = cardData.title;
        this.unique = cardData.unique;

        this._controller = owner;
        this.id = cardData.id;
        this.printedTraits = new Set(EnumHelpers.checkConvertToEnum(cardData.traits, Trait));
        this.printedType = Card.buildTypeFromPrinted(cardData.types);

        this.printedKeywords = KeywordHelpers.parseKeywords(cardData.keywords,
            this.printedType === CardType.Leader ? cardData.deployBox : cardData.text,
            this.internalName);

        this.setupStateWatchers(this.owner.game.stateWatcherRegistrar);
    }


    // ******************************************* ABILITY GETTERS *******************************************
    /**
     * `SWU 7.2.1`: An action ability is an ability indicated by the bolded word “Action.” Most action
     * abilities have a cost in brackets that must be paid in order to use the ability.
     */
    public getActionAbilities(): ActionAbility[] {
        const deduplicatedActionAbilities: ActionAbility[] = [];

        const seenCardNameSources = new Set<string>();
        for (const action of this.actionAbilities) {
            if (action.printedAbility) {
                deduplicatedActionAbilities.push(action);
            } else if (!seenCardNameSources.has(action.gainAbilitySource.internalName)) {
                // Deduplicate any identical gained action abilities from the same source card (e.g., two Heroic Resolve actions)
                deduplicatedActionAbilities.push(action);
                seenCardNameSources.add(action.gainAbilitySource.internalName);
            }
        }

        return deduplicatedActionAbilities;
    }

    /**
     * `SWU 7.3.1`: A constant ability is always in effect while the card it is on is in play. Constant abilities
     * don’t have any special text styling
     */
    public getConstantAbilities(): IConstantAbility[] {
        return this.constantAbilities;
    }

    /**
     * Any actions that a player could legally invoke with this card as the source. This includes "default"
     * actions such as playing a card or attacking, as well as any action abilities from card text.
     */
    public getActions(): PlayerOrCardAbility[] {
        return this.getActionAbilities();
    }


    // **************************************** INITIALIZATION HELPERS ****************************************
    public static buildTypeFromPrinted(printedTypes: string[]): CardType {
        if (printedTypes.length === 2) {
            if (printedTypes[0] !== 'token') {
                throw new Error(`Unexpected card types: ${printedTypes}`);
            }

            switch (printedTypes[1]) {
                case 'unit':
                    return CardType.TokenUnit;
                case 'upgrade':
                    return CardType.TokenUpgrade;
                default:
                    throw new Error(`Unexpected token types: ${printedTypes}`);
            }
        }

        Contract.assertArraySize(printedTypes, 1, `Unexpected card types: ${printedTypes}`);
        switch (printedTypes[0]) {
            case 'event':
                return CardType.Event;
            case 'unit':
                return CardType.BasicUnit;
            case 'leader':
                return CardType.Leader;
            case 'base':
                return CardType.Base;
            case 'upgrade':
                return CardType.BasicUpgrade;
            default:
                throw new Error(`Unexpected card type: ${printedTypes[0]}`);
        }
    }

    private validateCardData(cardData: any) {
        Contract.assertNotNullLike(cardData);
        Contract.assertNotNullLike(cardData.id);
        Contract.assertNotNullLike(cardData.title);
        Contract.assertNotNullLike(cardData.types);
        Contract.assertNotNullLike(cardData.traits);
        Contract.assertNotNullLike(cardData.aspects);
        Contract.assertNotNullLike(cardData.keywords);
        Contract.assertNotNullLike(cardData.unique);
    }

    /**
     * If this is a subclass implementation of a specific card, validate that it matches the provided card data
     */
    private validateImplementationId(cardData: any): void {
        const implementationId = this.getImplementationId();
        if (implementationId) {
            if (cardData.id !== implementationId.id || cardData.internalName !== implementationId.internalName) {
                throw new Error(
                    `Provided card data { ${cardData.id}, ${cardData.internalName} } does not match the data from the card class: { ${implementationId.id}, ${implementationId.internalName} }. Confirm that you are matching the card data to the right card implementation class.`
                );
            }
        }
    }

    /**
     * Subclass implementations for specific cards must override this method and provide the id
     * information for the specific card
     */
    protected getImplementationId(): null | { internalName: string; id: string } {
        return null;
    }

    protected unpackConstructorArgs(...args: any[]): [Player, any] {
        Contract.assertArraySize(args, 2);

        return [args[0] as Player, args[1]];
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    protected setupStateWatchers(registrar: StateWatcherRegistrar) {
    }

    // ******************************************* ABILITY HELPERS *******************************************
    public createActionAbility<TSource extends Card = this>(properties: IActionAbilityProps<TSource>): ActionAbility {
        return new ActionAbility(this.game, this, Object.assign(this.buildGeneralAbilityProps('action'), properties));
    }

    public createConstantAbility<TSource extends Card = this>(properties: IConstantAbilityProps<TSource>): IConstantAbility {
        const sourceZoneFilter = properties.sourceZoneFilter || WildcardZoneName.AnyArena;

        return {
            duration: Duration.Persistent,
            sourceZoneFilter,
            ...properties,
            ...this.buildGeneralAbilityProps('constant'),
            uuid: uuidv4()
        };
    }

    protected buildGeneralAbilityProps(abilityTypeDescriptor: string) {
        return {
            cardName: this.title,

            // example: "wampa_triggered_0"
            abilityIdentifier: `${this.internalName}_${abilityTypeDescriptor}_${this.getNextAbilityIdx()}`,
        };
    }

    /** Increments the ability index counter used for adding an index number to an ability's ID */
    private getNextAbilityIdx() {
        this.nextAbilityIdx++;
        return this.nextAbilityIdx - 1;
    }


    // ******************************************* CARD TYPE HELPERS *******************************************
    public isEvent(): this is EventCard {
        return this.type === CardType.Event;
    }

    public isUnit(): this is UnitCard {
        return this.type === CardType.BasicUnit || this.type === CardType.LeaderUnit || this.type === CardType.TokenUnit;
    }

    public isUpgrade(): this is UpgradeCard {
        return this.type === CardType.BasicUpgrade || this.type === CardType.TokenUpgrade;
    }

    public isBase(): this is BaseCard {
        return this.type === CardType.Base;
    }

    public isLeader(): this is LeaderCard {
        return this.type === CardType.Leader || this.type === CardType.LeaderUnit;
    }

    public isLeaderUnit(): this is LeaderUnitCard {
        return this.type === CardType.LeaderUnit;
    }

    public isNonLeaderUnit(): this is NonLeaderUnitCard {
        return this.type === CardType.BasicUnit || this.type === CardType.TokenUnit;
    }

    public isToken(): this is TokenCard {
        return this.type === CardType.TokenUnit || this.type === CardType.TokenUpgrade;
    }

    public isShield(): this is Shield {
        return false;
    }

    /** Returns true if the card is of a type that can legally be damaged. Note that the card might still be in a zone where damage is not legal. */
    public canBeDamaged(): this is CardWithDamageProperty {
        return false;
    }

    /** Returns true if the card is of a type that can legally be involved in an attack. Note that the card might still be in a zone where attacks are not legal. */
    public canBeInvolvedInAttack(): this is CardWithDamageProperty {
        return this.canBeDamaged();
    }

    /**
     * Returns true if the card is in a zone where it can legally be exhausted.
     * The returned type set is equivalent to {@link CardWithExhaustProperty}.
     */
    public canBeExhausted(): this is PlayableOrDeployableCard {
        return false;
    }

    /**
     * Returns true if the card is in a playable card (not deployable) or a token
     */
    public isTokenOrPlayable(): this is TokenOrPlayableCard {
        return false;
    }

    /**
     * Returns true if the card is a type that can legally have triggered abilities.
     * The returned type set is equivalent to {@link CardWithTriggeredAbilities}.
     */
    public canRegisterTriggeredAbilities(): this is InPlayCard {
        return false;
    }

    /**
     * Returns true if the card is a type that can legally have constant abilities.
     * The returned type set is equivalent to {@link CardWithConstantAbilities}.
     */
    public canRegisterConstantAbilities(): this is InPlayCard {
        return false;
    }

    /**
     * Returns true if the card is a type that can be put into play and considered "in play."
     * The returned type set is equivalent to {@link InPlayCard}.
     */
    public canBeInPlay(): this is InPlayCard {
        return false;
    }


    // ******************************************* KEYWORD HELPERS *******************************************
    /** Helper method for {@link Card.keywords} */
    protected getKeywords() {
        let keywordInstances = [...this.printedKeywords];
        const gainKeywordEffects = this.getOngoingEffects().filter((ongoingEffect) => ongoingEffect.type === EffectName.GainKeyword);
        for (const effect of gainKeywordEffects) {
            keywordInstances.push(effect.getValue(this));
        }
        keywordInstances = keywordInstances.filter((instance) => !instance.isBlank);

        return keywordInstances;
    }

    public getKeywordWithCostValues(keywordName: KeywordName): KeywordWithCostValues {
        const keyword = this.getKeywords().find((keyword) => keyword.valueOf() === keywordName);
        Contract.assertTrue(keyword.hasCostValue(), `Keyword ${keywordName} does not have cost values.`);
        return keyword as KeywordWithCostValues;
    }

    public hasSomeKeyword(keywords: Set<KeywordName> | KeywordName | KeywordName[]): boolean {
        return this.hasSome(keywords, this.keywords.map((keyword) => keyword.name));
    }

    public hasEveryKeyword(keywords: Set<KeywordName> | KeywordName[]): boolean {
        return this.hasEvery(keywords, this.keywords.map((keyword) => keyword.name));
    }


    // ******************************************* TRAIT HELPERS *******************************************
    /** Helper method for {@link Card.traits} */
    private getTraits() {
        const traits = new Set(this.printedTraits);

        for (const gainedTrait of this.getOngoingEffectValues(EffectName.AddTrait)) {
            traits.add(gainedTrait);
        }
        for (const lostTrait of this.getOngoingEffectValues(EffectName.LoseTrait)) {
            traits.delete(lostTrait);
        }

        return traits;
    }

    public hasSomeTrait(traits: Set<Trait> | Trait | Trait[]): boolean {
        return this.hasSome(traits, this.traits);
    }

    public hasEveryTrait(traits: Set<Trait> | Trait[]): boolean {
        return this.hasEvery(traits, this.traits);
    }


    // ******************************************* ASPECT HELPERS *******************************************
    public hasSomeAspect(aspects: Set<Aspect> | Aspect | Aspect[]): boolean {
        return this.hasSome(aspects, this.aspects);
    }

    public hasEveryAspect(aspects: Set<Aspect> | Aspect[]): boolean {
        return this.hasEvery(aspects, this.aspects);
    }


    // *************************************** EFFECT HELPERS ***************************************
    public isBlank(): boolean {
        return this.hasOngoingEffect(EffectName.Blank);
    }

    public canTriggerAbilities(context: AbilityContext, ignoredRequirements = []): boolean {
        return (
            !this.facedown &&
            (ignoredRequirements.includes('triggeringRestrictions') ||
              !this.hasRestriction(AbilityRestriction.TriggerAbilities, context))
        );
    }

    public canInitiateKeywords(context: AbilityContext): boolean {
        return !this.facedown && !this.hasRestriction(AbilityRestriction.InitiateKeywords, context);
    }


    // ******************************************* ZONE MANAGEMENT *******************************************
    /**
     * Moves a card to a new zone, optionally resetting the card's controller back to its owner.
     *
     * @param targetZone Zone to move to
     * @param resetController If true (default behavior), sets `card.controller = card.owner` on move. Set to
     * false for a hypothetical situation where a controlled opponent unit is being moved between zones and
     * needs to not change hands back to the owner.
     */
    public moveTo(targetZone: MoveZoneDestination, resetController = true) {
        Contract.assertNotNullLike(this._zone, `Attempting to move card ${this.internalName} before initializing zone`);

        const originalZone = this.zoneName;

        if (originalZone === targetZone) {
            return;
        }

        this.cleanupBeforeMove(targetZone);

        const prevZone = this._zone;

        if (prevZone != null) {
            if (prevZone.name === ZoneName.Base) {
                Contract.assertTrue(this.isLeader(), `Attempting to move card ${this.internalName} from ${prevZone}`);
                prevZone.removeLeader();
            } else {
                prevZone.removeCard(this);
            }
        }

        if (resetController) {
            this._controller = this.owner;
        }

        this.addSelfToZone(targetZone);
        this.initializeForCurrentZone(prevZone.name);

        this.game.emitEvent(EventName.OnCardMoved, null, {
            card: this,
            originalZone: originalZone,
            newZone: targetZone
        });

        this.game.registerMovedCard(this);
    }

    public initializeZone(zone: Zone) {
        Contract.assertIsNullLike(this._zone, `Attempting to initialize zone for card ${this.internalName} to ${zone.name} but it is already set`);

        this._zone = zone;

        this.initializeForStartZone();
        this.initializeForCurrentZone(null);
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    protected initializeForStartZone(): void {}

    private addSelfToZone(zoneName: MoveZoneDestination) {
        switch (zoneName) {
            case ZoneName.Base:
                this._zone = this.owner.baseZone;
                Contract.assertTrue(this.isLeader());
                this._zone.setLeader(this);
                break;

            case DeckZoneDestination.DeckBottom:
            case DeckZoneDestination.DeckTop:
                this._zone = this.owner.deckZone;
                Contract.assertTrue(this.isTokenOrPlayable() && !this.isToken());
                this._zone.addCard(this, zoneName);
                break;

            case ZoneName.Discard:
                this._zone = this.owner.discardZone;
                Contract.assertTrue(this.isTokenOrPlayable() && !this.isToken());
                this._zone.addCard(this);
                break;

            case ZoneName.GroundArena:
                this._zone = this.game.groundArena;
                Contract.assertTrue(this.canBeInPlay());
                this._zone.addCard(this);
                break;

            case ZoneName.Hand:
                this._zone = this.owner.handZone;
                Contract.assertTrue(this.isTokenOrPlayable() && !this.isToken());
                this._zone.addCard(this);
                break;

            case ZoneName.OutsideTheGame:
                this._zone = this.owner.outsideTheGameZone;
                Contract.assertTrue(this.isTokenOrPlayable());
                this._zone.addCard(this);
                break;

            case ZoneName.Resource:
                this._zone = this.controller.resourceZone;
                Contract.assertTrue(this.isTokenOrPlayable() && !this.isToken());
                this._zone.addCard(this);
                break;

            case ZoneName.SpaceArena:
                this._zone = this.game.spaceArena;
                Contract.assertTrue(this.canBeInPlay());
                this._zone.addCard(this);
                break;

            default:
                Contract.fail(`Unknown zone enum value: ${zoneName}`);
        }
    }

    /**
     * Deals with any engine effects of leaving the current zone before the move happens
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    protected cleanupBeforeMove(nextZone: MoveZoneDestination) {}

    /**
     * Updates the card's abilities for its current zone after being moved.
     * Called from {@link Game.resolveGameState} after event resolution.
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public resolveAbilitiesForNewZone() {}

    /**
     * Deals with the engine effects of entering a new zone, making sure all statuses are set with legal values.
     * If a card should have a different status on entry (e.g., readied instead of exhausted), call this method first
     * and then update the card state(s) as needed.
     *
     * Subclass methods should override this and call the super method to ensure all statuses are set correctly.
     */
    protected initializeForCurrentZone(prevZone?: ZoneName) {
        this.hiddenForOpponent = EnumHelpers.isHidden(this.zoneName, RelativePlayer.Self);

        switch (this.zoneName) {
            case ZoneName.SpaceArena:
            case ZoneName.GroundArena:
                this._controller = this.owner;
                this._facedown = false;
                this.hiddenForController = false;
                break;

            case ZoneName.Base:
                this._controller = this.owner;
                this._facedown = false;
                this.hiddenForController = false;
                break;

            case ZoneName.Resource:
                this._controller = this.owner;
                this._facedown = true;
                this.hiddenForController = false;
                break;

            case ZoneName.Deck:
                this._controller = this.owner;
                this._facedown = true;
                this.hiddenForController = true;
                break;

            case ZoneName.Hand:
                this._controller = this.owner;
                this._facedown = false;
                this.hiddenForController = false;
                break;

            case ZoneName.Discard:
            case ZoneName.OutsideTheGame:
                this._controller = this.owner;
                this._facedown = false;
                this.hiddenForController = false;
                break;

            default:
                Contract.fail(`Unknown zone enum value: ${this.zoneName}`);
        }
    }

    // ******************************************* MISC *******************************************
    /**
     * Adds a dynamically gained action ability to the unit. Used for "gain ability" effects.
     *
     * Duplicates of the same gained action from duplicates of the same source card can be added,
     * but only one will be presented to the user as an available action.
     *
     * @returns The uuid of the created action ability
     */
    public addGainedActionAbility(properties: IActionAbilityProps): string {
        const addedAbility = this.createActionAbility(properties);
        this.actionAbilities.push(addedAbility);

        return addedAbility.uuid;
    }

    /** Removes a dynamically gained action ability */
    public removeGainedActionAbility(removeAbilityUuid: string): void {
        const updatedAbilityList = this.actionAbilities.filter((ability) => ability.uuid !== removeAbilityUuid);
        Contract.assertEqual(updatedAbilityList.length, this.actionAbilities.length - 1, `Expected to find one instance of gained action ability to remove but instead found ${this.actionAbilities.length - updatedAbilityList.length}`);

        this.actionAbilities = updatedAbilityList;
    }

    protected assertPropertyEnabled(propertyVal: any, propertyName: string) {
        Contract.assertNotNullLike(propertyVal, this.buildPropertyDisabledStr(propertyName));
    }

    protected assertPropertyEnabledBoolean(enabled: boolean, propertyName: string) {
        Contract.assertTrue(enabled, this.buildPropertyDisabledStr(propertyName));
    }

    private buildPropertyDisabledStr(propertyName: string) {
        return `Attempting to read property '${propertyName}' on '${this.internalName}' but it is in zone '${this.zoneName}' where the property does not apply`;
    }

    protected resetLimits() {
        for (const action of this.actionAbilities) {
            if (action.limit) {
                action.limit.reset();
            }
        }
    }

    public isResource() {
        return this.zoneName === ZoneName.Resource;
    }

    // TODO: should we break this out into variants for event (Play) vs other (EnterPlay)?
    public canPlay(context, type) {
        return (
            !this.hasRestriction(type, context) &&
            !context.player.hasRestriction(type, context) &&
            !this.hasRestriction(AbilityRestriction.Play, context) &&
            !context.player.hasRestriction(AbilityRestriction.Play, context) &&
            !this.hasRestriction(AbilityRestriction.EnterPlay, context) &&
            !context.player.hasRestriction(AbilityRestriction.EnterPlay, context)
        );
    }

    /** @deprecated Copied from L5R, not yet updated for SWU rules */
    public anotherUniqueInPlay(player) {
        return (
            this.unique &&
            this.game.allCards.some(
                (card) =>
                    card.isInPlay() &&
                    card.title === this.title &&
                    card !== this &&
                    (card.owner === player || card.controller === player || card.owner === this.owner)
            )
        );
    }

    /** @deprecated Copied from L5R, not yet updated for SWU rules */
    public anotherUniqueInPlayControlledBy(player) {
        return (
            this.unique &&
            this.game.allCards.some(
                (card) =>
                    card.isInPlay() &&
                    card.title === this.title &&
                    card !== this &&
                    card.controller === player
            )
        );
    }

    private hasSome<T>(valueOrValuesToCheck: T | Set<T> | T[], cardValues: Set<T> | T[]): boolean {
        const valuesToCheck = this.asSetOrArray(valueOrValuesToCheck);
        const cardValuesContains = Array.isArray(cardValues)
            ? (value: T) => cardValues.includes(value)
            : (value: T) => cardValues.has(value);

        for (const value of valuesToCheck) {
            if (cardValuesContains(value)) {
                return true;
            }
        }
        return false;
    }

    private hasEvery<T>(valueOrValuesToCheck: T | Set<T> | T[], cardValues: Set<T> | T[]): boolean {
        const valuesToCheck = this.asSetOrArray(valueOrValuesToCheck);
        const cardValuesContains = Array.isArray(cardValues)
            ? (value: T) => cardValues.includes(value)
            : (value: T) => cardValues.has(value);

        for (const value of valuesToCheck) {
            if (!cardValuesContains(value)) {
                return false;
            }
        }
        return false;
    }

    private asSetOrArray<T>(valueOrValuesToCheck: T | Set<T> | T[]): Set<T> | T[] {
        if (!(valueOrValuesToCheck instanceof Set) && !(valueOrValuesToCheck instanceof Array)) {
            return [valueOrValuesToCheck];
        }
        return valueOrValuesToCheck;
    }

    public getModifiedAbilityLimitMax(player: Player, ability: CardAbility, max: number): number {
        const effects = this.getOngoingEffects().filter((effect) => effect.type === EffectName.IncreaseLimitOnAbilities);
        let total = max;
        effects.forEach((effect) => {
            const value = effect.getValue(this);
            const applyingPlayer = value.applyingPlayer || effect.context.player;
            const targetAbility = value.targetAbility;
            if ((!targetAbility || targetAbility === ability) && applyingPlayer === player) {
                total++;
            }
        });

        return total;
    }

    /**
     * Deals with the engine effects of leaving play, making sure all statuses are removed. Anything which changes
     * the state of the card should be here. This is also called in some strange corner cases e.g. for upgrades
     * which aren't actually in play themselves when their parent (which is in play) leaves play.
     */
    public leavesPlay() {
        // TODO: reuse this for capture logic
        // // Remove any cards underneath from the game
        // const cardsUnderneath = this.controller.getCardPile(this.uuid).map((a) => a);
        // if (cardsUnderneath.length > 0) {
        //     cardsUnderneath.forEach((card) => {
        //         this.controller.moveCard(card, ZoneName.RemovedFromGame);
        //     });
        //     this.game.addMessage(
        //         '{0} {1} removed from the game due to {2} leaving play',
        //         cardsUnderneath,
        //         cardsUnderneath.length === 1 ? 'is' : 'are',
        //         this
        //     );
        // }
    }

    // TODO CAPTURE: will probably need to leverage or modify the below "child card" methods (see basecard.ts in L5R for reference)
    // originally these were for managing province cards

    // protected addChildCard(card, zone) {
    //     this.childCards.push(card);
    //     this.controller.moveCard(card, zone);
    // }

    // protected removeChildCard(card, zone) {
    //     if (!card) {
    //         return;
    //     }

    //     this.childCards = this.childCards.filter((a) => a !== card);
    //     this.controller.moveCard(card, zone);
    // }

    // createSnapshot() {
    //     const clone = new Card(this.owner, this.cardData);

    //     // clone.upgrades = _(this.upgrades.map((attachment) => attachment.createSnapshot()));
    //     clone.childCards = this.childCards.map((card) => card.createSnapshot());
    //     clone.effects = [...this.effects];
    //     clone.controller = this.controller;
    //     clone.exhausted = this.exhausted;
    //     // clone.statusTokens = [...this.statusTokens];
    //     clone.zoneName = this.zoneName;
    //     clone.parentCard = this.parentCard;
    //     clone.aspects = [...this.aspects];
    //     // clone.fate = this.fate;
    //     // clone.inConflict = this.inConflict;
    //     clone.traits = Array.from(this.getTraits());
    //     clone.uuid = this.uuid;
    //     return clone;
    // }


    // TODO: Clean this up and review rules for visibility. We can probably reduce this down to arity 1
    /*
    * This is the infomation for each card that is sent to the client.
    */

    public getSummary(activePlayer, hideWhenFaceup) {
        const isActivePlayer = activePlayer === this.controller;
        const selectionState = activePlayer.getCardSelectionState(this);

        // This is my facedown card, but I'm not allowed to look at it
        // OR This is not my card, and it's either facedown or hidden from me
        if (
            isActivePlayer
                ? this.facedown
                : this.facedown || hideWhenFaceup
        ) {
            const state = {
                controller: this.controller.getShortSummary(),
                // menu: isActivePlayer ? this.getMenu() : undefined,
                facedown: true,
                zone: this.zoneName,
                uuid: isActivePlayer ? this.uuid : undefined
            };
            return { ...state, ...selectionState };
        }


        const state = {
            id: this.cardData.id,
            controlled: this.owner !== this.controller,
            // facedown: this.isFacedown(),
            zone: this.zoneName,
            // menu: this.getMenu(),
            name: this.cardData.title,
            cost: this.cardData.cost,
            power: this.cardData.power,
            hp: this.cardData.hp,
            // popupMenuText: this.popupMenuText,
            // showPopup: this.showPopup,
            // tokens: this.tokens,
            // types: this.types,
            uuid: this.uuid,
            ...selectionState
        };

        return state;
    }

    public override getShortSummaryForControls(activePlayer: Player): any {
        if (!this.isHiddenForPlayer(activePlayer)) {
            return { hidden: true };
        }
        return super.getShortSummaryForControls(activePlayer);
    }

    private isHiddenForPlayer(player: Player) {
        switch (player) {
            case this.controller:
                return this.hiddenForController;
            case this.controller.opponent:
                return this.hiddenForOpponent;
            default:
                Contract.fail(`Unknown player: ${player}`);
                return false;
        }
    }
}