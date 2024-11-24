import { InitiateAttackAction } from '../../../actions/InitiateAttackAction';
import { Arena, CardType, EffectName, EventName, KeywordName, StatType, ZoneName } from '../../Constants';
import StatsModifierWrapper from '../../ongoingEffect/effectImpl/StatsModifierWrapper';
import { IOngoingCardEffect } from '../../ongoingEffect/IOngoingCardEffect';
import * as Contract from '../../utils/Contract';
import { InPlayCard, InPlayCardConstructor } from '../baseClasses/InPlayCard';
import { WithDamage } from './Damage';
import { WithPrintedPower } from './PrintedPower';
import * as EnumHelpers from '../../utils/EnumHelpers';
import { UpgradeCard } from '../UpgradeCard';
import { Card } from '../Card';
import { ITriggeredAbilityProps } from '../../../Interfaces';
import { KeywordWithAbilityDefinition, KeywordWithNumericValue } from '../../ability/KeywordInstance';
import TriggeredAbility from '../../ability/TriggeredAbility';
import { IConstantAbility } from '../../ongoingEffect/IConstantAbility';
import { RestoreAbility } from '../../../abilities/keyword/RestoreAbility';
import { ShieldedAbility } from '../../../abilities/keyword/ShieldedAbility';
import type { UnitCard } from '../CardTypes';
import { SaboteurDefeatShieldsAbility } from '../../../abilities/keyword/SaboteurDefeatShieldsAbility';
import { AmbushAbility } from '../../../abilities/keyword/AmbushAbility';
import type Game from '../../Game';
import { GameEvent } from '../../event/GameEvent';
import { DefeatSourceType, IDamageSource } from '../../../IDamageOrDefeatSource';
import { FrameworkDefeatCardSystem } from '../../../gameSystems/FrameworkDefeatCardSystem';
import * as KeywordHelpers from '../../ability/KeywordHelpers';

export const UnitPropertiesCard = WithUnitProperties(InPlayCard);

/**
 * Mixin function that adds the standard properties for a unit (leader or non-leader) to a base class.
 * Specifically it gains:
 * - hp, damage, and power (from the corresponding mixins {@link WithPrintedHp}, {@link WithDamage}, and {@link WithPrintedPower})
 * - the ability for hp and power to be modified by effects
 * - the {@link InitiateAttackAction} ability so that the card can attack
 * - the ability to have attached upgrades
 */
export function WithUnitProperties<TBaseClass extends InPlayCardConstructor>(BaseClass: TBaseClass) {
    // create a "base" class that has the damage, hp, and power properties from other mixins
    const StatsAndDamageClass = WithDamage(WithPrintedPower(BaseClass));

    return class AsUnit extends StatsAndDamageClass {
        public static registerRulesListeners(game: Game) {
            // register listeners for when-played keyword abilities (see comment in EventWindow.ts for explanation of 'postResolve')
            game.on(EventName.OnUnitEntersPlay + ':postResolve', (event) => {
                const card = event.card as Card;
                if (card.isUnit()) {
                    card.checkRegisterWhenPlayedKeywordAbilities(event);
                }
            });

            // register listeners for on-attack keyword abilities
            game.on(EventName.OnAttackDeclared, (event) => {
                const card = event.attack.attacker as Card;
                if (card.isUnit()) {
                    card.checkRegisterOnAttackKeywordAbilities(event);
                }
            });

            // register listeners for on-defeat keyword abilities
            game.on(EventName.OnCardDefeated, (event) => {
                const card = event.card as Card;
                if (card.zoneName !== ZoneName.Resource && card.isUnit()) {
                    card.checkRegisterWhenDefeatedKeywordAbilities(event);
                }
            });

            // TODO CAPTURE: add listener here enabling bounty on capture
        }

        // ************************************* FIELDS AND PROPERTIES *************************************
        public readonly defaultArena: Arena;

        protected _upgrades?: UpgradeCard[] = null;

        private _attackKeywordAbilities?: (TriggeredAbility | IConstantAbility)[] = null;
        private _whenDefeatedKeywordAbilities?: TriggeredAbility[] = null;
        private _whenPlayedKeywordAbilities?: TriggeredAbility[] = null;

        public get upgrades(): UpgradeCard[] {
            this.assertPropertyEnabled(this._upgrades, 'upgrades');
            return this._upgrades;
        }

        public isAttacking(): boolean {
            return (this as Card) === (this.activeAttack?.attacker as Card);
        }

        public isUpgraded(): boolean {
            return this.upgrades.length > 0;
        }

        public hasShield(): boolean {
            return this.upgrades.some((card) => card.isShield());
        }

        // ****************************************** CONSTRUCTOR ******************************************
        // see Card constructor for list of expected args
        public constructor(...args: any[]) {
            super(...args);
            const [Player, cardData] = this.unpackConstructorArgs(...args);

            Contract.assertTrue(EnumHelpers.isUnit(this.printedType) || this.printedType === CardType.Leader);

            Contract.assertNotNullLike(cardData.arena);
            switch (cardData.arena) {
                case 'space':
                    this.defaultArena = ZoneName.SpaceArena;
                    break;
                case 'ground':
                    this.defaultArena = ZoneName.GroundArena;
                    break;
                default:
                    Contract.fail(`Unknown arena type in card data: ${cardData.arena}`);
            }

            this.defaultActions.push(new InitiateAttackAction(this));
        }

        // ****************************************** PROPERTY HELPERS ******************************************
        public override getHp(): number {
            return this.getModifiedStatValue(StatType.Hp);
        }

        public override getPower(): number {
            return this.getModifiedStatValue(StatType.Power);
        }

        public override isUnit(): this is UnitCard {
            return true;
        }

        protected setUpgradesEnabled(enabledStatus: boolean) {
            this._upgrades = enabledStatus ? [] : null;
        }

        protected override setDamageEnabled(enabledStatus: boolean): void {
            super.setDamageEnabled(enabledStatus);
        }

        // ***************************************** ATTACK HELPERS *****************************************
        /**
         * Check if there are any effect restrictions preventing this unit from attacking the passed target.
         * Returns true if so.
         */
        public effectsPreventAttack(target: Card) {
            if (this.hasOngoingEffect(EffectName.CannotAttackBase) && target.isBase()) {
                return true;
            }

            return false;
        }

        // ***************************************** ABILITY HELPERS *****************************************
        protected addOnAttackAbility(properties: Omit<ITriggeredAbilityProps<this>, 'when' | 'aggregateWhen'>): void {
            const triggeredProperties = { ...properties, when: { onAttackDeclared: (event, context) => event.attack.attacker === context.source } };
            this.addTriggeredAbility(triggeredProperties);
        }

        protected addBountyAbility(properties: Omit<ITriggeredAbilityProps<this>, 'when' | 'aggregateWhen' | 'abilityController'>): void {
            const triggeredProperties = KeywordHelpers.createBountyAbilityFromProps(properties);

            const bountyKeywordsWithoutImpl = this.printedKeywords.filter((keyword) => keyword.name === KeywordName.Bounty && !keyword.isFullyImplemented);

            if (bountyKeywordsWithoutImpl.length === 0) {
                const bountyKeywordsWithImpl = this.printedKeywords.filter((keyword) => keyword.name === KeywordName.Bounty && keyword.isFullyImplemented);

                if (bountyKeywordsWithImpl.length > 0) {
                    Contract.fail(`Attempting to add a bounty ability '${properties.title}' to ${this.internalName} but all instances of the Bounty keyword already have a definition`);
                }

                Contract.fail(`Attempting to add a bounty ability '${properties.title}' to ${this.internalName} but it has no printed instances of the Bounty keyword`);
            }

            const bountyAbilityToAssign = bountyKeywordsWithoutImpl[0];

            // TODO: see if there's a better way using discriminating unions to avoid needing a cast when getting keyword instances
            Contract.assertTrue(bountyAbilityToAssign instanceof KeywordWithAbilityDefinition);
            bountyAbilityToAssign.setAbilityProps(triggeredProperties);
        }

        public override getTriggeredAbilities(): TriggeredAbility[] {
            let triggeredAbilities = super.getTriggeredAbilities();

            // add any temporarily registered attack abilities from keywords
            if (this._attackKeywordAbilities !== null) {
                triggeredAbilities = triggeredAbilities.concat(this._attackKeywordAbilities.filter((ability) => ability instanceof TriggeredAbility));
            }
            if (this._whenPlayedKeywordAbilities !== null) {
                triggeredAbilities = triggeredAbilities.concat(this._whenPlayedKeywordAbilities);
            }
            if (this._whenDefeatedKeywordAbilities !== null) {
                triggeredAbilities = triggeredAbilities.concat(this._whenDefeatedKeywordAbilities);
            }

            return triggeredAbilities;
        }

        public override getConstantAbilities(): IConstantAbility[] {
            let constantAbilities = super.getConstantAbilities();

            // add any temporarily registered attack abilities from keywords
            if (this._attackKeywordAbilities !== null) {
                constantAbilities = constantAbilities.concat(
                    this._attackKeywordAbilities.filter((ability) => !(ability instanceof TriggeredAbility))
                        .map((ability) => ability as IConstantAbility)
                );
            }

            return constantAbilities;
        }

        // *************************************** KEYWORD HELPERS ***************************************
        /**
         * Checks if the unit currently has any keywords with a "when played" effect and registers them if so.
         * Also adds a listener to remove the registered abilities after the effect resolves.
         */
        public checkRegisterWhenPlayedKeywordAbilities(event: GameEvent) {
            const hasAmbush = this.hasSomeKeyword(KeywordName.Ambush);
            const hasShielded = this.hasSomeKeyword(KeywordName.Shielded);

            if (!hasAmbush && !hasShielded) {
                return;
            }

            Contract.assertIsNullLike(
                this._whenPlayedKeywordAbilities,
                `Failed to unregister when played abilities from previous play: ${this._whenPlayedKeywordAbilities?.map((ability) => ability.title).join(', ')}`
            );

            this._whenPlayedKeywordAbilities = [];

            if (hasAmbush) {
                const ambushProps = Object.assign(this.buildGeneralAbilityProps('keyword_ambush'), AmbushAbility.buildAmbushAbilityProperties());
                const ambushAbility = this.createTriggeredAbility(ambushProps);
                ambushAbility.registerEvents();
                this._whenPlayedKeywordAbilities.push(ambushAbility);
            }

            if (hasShielded) {
                const shieldedProps = Object.assign(this.buildGeneralAbilityProps('keyword_shielded'), ShieldedAbility.buildShieldedAbilityProperties());
                const shieldedAbility = this.createTriggeredAbility(shieldedProps);
                shieldedAbility.registerEvents();
                this._whenPlayedKeywordAbilities.push(shieldedAbility);
            }

            event.addCleanupHandler(() => this.unregisterWhenPlayedKeywords());
        }

        /**
         * Registers any keywords which need to be explicitly registered for the attack process.
         * These should be unregistered after the end of the attack.
         *
         * Note: Check rule 7.5 to see if a keyword should be here. Only keywords that are
         *      "On Attack" keywords should go here. As of Set 2 (SHD) this is only Restore
         *      and the defeat all shields portion of Saboteur.
         */
        public checkRegisterOnAttackKeywordAbilities(event: GameEvent) {
            const hasRestore = this.hasSomeKeyword(KeywordName.Restore);
            const hasSaboteur = this.hasSomeKeyword(KeywordName.Saboteur);

            if (!hasRestore && !hasSaboteur) {
                return;
            }

            Contract.assertIsNullLike(
                this._attackKeywordAbilities,
                `Failed to unregister on attack abilities from previous attack: ${this._attackKeywordAbilities?.map((ability) => ability.title).join(', ')}`
            );

            this._attackKeywordAbilities = [];

            if (hasRestore) {
                const restoreAmount = this.getNumericKeywordSum(KeywordName.Restore);
                const restoreProps = Object.assign(this.buildGeneralAbilityProps('keyword_restore'), RestoreAbility.buildRestoreAbilityProperties(restoreAmount));
                const restoreAbility = this.createTriggeredAbility(restoreProps);
                restoreAbility.registerEvents();
                this._attackKeywordAbilities.push(restoreAbility);
            }

            if (hasSaboteur) {
                const saboteurProps = Object.assign(this.buildGeneralAbilityProps('keyword_saboteur'), SaboteurDefeatShieldsAbility.buildSaboteurAbilityProperties());
                const saboteurAbility = this.createTriggeredAbility(saboteurProps);
                saboteurAbility.registerEvents();
                this._attackKeywordAbilities.push(saboteurAbility);
            }

            event.addCleanupHandler(() => this.unregisterAttackKeywords());
        }

        /**
         * Checks if the unit currently has any keywords with a "when defeated" effect and registers them if so.
         * Also adds a listener to remove the registered abilities after the effect resolves.
         */
        public checkRegisterWhenDefeatedKeywordAbilities(event: GameEvent) {
            const bountyKeywords = this.getBountyAbilities();
            if (bountyKeywords.length === 0) {
                return;
            }

            Contract.assertIsNullLike(
                this._whenDefeatedKeywordAbilities,
                `Failed to unregister when defeated abilities from previous defeat: ${this._whenDefeatedKeywordAbilities?.map((ability) => ability.title).join(', ')}`
            );

            this._whenDefeatedKeywordAbilities = [];

            for (const bountyKeyword of bountyKeywords) {
                const abilityProps = bountyKeyword.abilityProps;

                const bountyAbility = this.createTriggeredAbility({
                    ...this.buildGeneralAbilityProps('keyword_bounty'),
                    ...abilityProps
                });

                bountyAbility.registerEvents();
                this._whenDefeatedKeywordAbilities.push(bountyAbility);
            }

            event.addCleanupHandler(() => this.unregisterWhenDefeatedKeywords());
        }

        private getBountyAbilities() {
            return this.getKeywords().filter((keyword) => keyword.name === KeywordName.Bounty)
                .map((keyword) => keyword as KeywordWithAbilityDefinition);
        }

        /**
         * For the "numeric" keywords (e.g. Raid), finds all instances of that keyword that are active
         * for this card and adds up the total of their effect values.
         * @returns value of the total effect if enabled, `null` if the effect is not present
         */
        public getNumericKeywordSum(keywordName: KeywordName.Restore | KeywordName.Raid): number | null {
            let keywordValueTotal = 0;

            for (const keyword of this.keywords.filter((keyword) => keyword.name === keywordName)) {
                Contract.assertTrue(keyword instanceof KeywordWithNumericValue);
                keywordValueTotal += keyword.value;
            }

            return keywordValueTotal > 0 ? keywordValueTotal : null;
        }

        public unregisterWhenPlayedKeywords() {
            Contract.assertTrue(Array.isArray(this._whenPlayedKeywordAbilities), 'Keyword ability when played registration was skipped');

            for (const ability of this._whenPlayedKeywordAbilities) {
                if (ability instanceof TriggeredAbility) {
                    ability.unregisterEvents();
                }
            }

            this._whenPlayedKeywordAbilities = null;
        }

        /**
         * Unregisters any keywords which need to be explicitly registered for the attack process.
         * These should be unregistered after the end of the attack.
         */
        public unregisterAttackKeywords() {
            Contract.assertTrue(Array.isArray(this._attackKeywordAbilities), 'Keyword ability attack registration was skipped');

            for (const ability of this._attackKeywordAbilities) {
                if (ability instanceof TriggeredAbility) {
                    ability.unregisterEvents();
                } else {
                    this.removeEffectFromEngine(ability.registeredEffects[0]);
                }
            }

            this._attackKeywordAbilities = null;
        }

        public unregisterWhenDefeatedKeywords() {
            Contract.assertTrue(Array.isArray(this._whenDefeatedKeywordAbilities), 'Keyword ability when defeated registration was skipped');

            for (const ability of this._whenDefeatedKeywordAbilities) {
                if (ability instanceof TriggeredAbility) {
                    ability.unregisterEvents();
                }
            }

            this._whenDefeatedKeywordAbilities = null;
        }

        // ***************************************** STAT HELPERS *****************************************
        public override addDamage(amount: number, source: IDamageSource): number {
            const damageAdded = super.addDamage(amount, source);

            this.checkDefeated(source);

            return damageAdded;
        }

        // TODO: FFG has yet to release detailed rules about how effects are used to determine which player defeated a unit,
        // specifically for complex cases like "what if Dodonna effect is keeping a Rebel unit alive and Dodonna is defeated."
        // Need to come through and implement that in the methods below once rules 3.0 comes out.

        /** Checks if the unit has been defeated due to an ongoing effect such as hp reduction */
        public checkDefeatedByOngoingEffect() {
            this.checkDefeated(DefeatSourceType.FrameworkEffect);
        }

        private checkDefeated(source: IDamageSource | DefeatSourceType.FrameworkEffect) {
            if (this.damage >= this.getHp() && !this._pendingDefeat) {
                // add defeat event to window
                this.game.addSubwindowEvents(
                    new FrameworkDefeatCardSystem({ target: this, defeatSource: source })
                        .generateEvent(this.game.getFrameworkContext())
                );

                // mark that this unit has a defeat pending so that other effects targeting it will not resolve
                this._pendingDefeat = true;
            }
        }

        private getModifiedStatValue(statType: StatType, floor = true, excludeModifiers = []) {
            const wrappedModifiers = this.getStatModifiers(excludeModifiers);

            const baseStatValue = StatsModifierWrapper.fromPrintedValues(this);

            const stat = wrappedModifiers.reduce((total, wrappedModifier) => total + wrappedModifier.modifier[statType], baseStatValue.modifier[statType]);

            return floor ? Math.max(0, stat) : stat;
        }

        // TODO: add a summary method that logs these modifiers (i.e., the names, amounts, etc.)
        private getStatModifiers(exclusions): StatsModifierWrapper[] {
            if (!exclusions) {
                exclusions = [];
            }

            let rawEffects;
            if (typeof exclusions === 'function') {
                rawEffects = this.getOngoingEffects().filter((effect) => !exclusions(effect));
            } else {
                rawEffects = this.getOngoingEffects().filter((effect) => !exclusions.includes(effect.type));
            }

            const modifierEffects: IOngoingCardEffect[] = rawEffects.filter((effect) => effect.type === EffectName.ModifyStats);
            const wrappedStatsModifiers = modifierEffects.map((modifierEffect) => StatsModifierWrapper.fromEffect(modifierEffect, this));

            // add stat bonuses from attached upgrades
            this.upgrades.forEach((upgrade) => wrappedStatsModifiers.push(StatsModifierWrapper.fromPrintedValues(upgrade)));

            if (this.hasSomeKeyword(KeywordName.Grit)) {
                const gritModifier = { power: this.damage, hp: 0 };
                wrappedStatsModifiers.push(new StatsModifierWrapper(gritModifier, 'Grit', false, this.type));
            }

            const raidAmount = this.getNumericKeywordSum(KeywordName.Raid);
            if (this.isAttacking() && raidAmount > 0) {
                const raidModifier = { power: raidAmount, hp: 0 };
                wrappedStatsModifiers.push(new StatsModifierWrapper(raidModifier, 'Raid', false, this.type));
            }

            return wrappedStatsModifiers;
        }

        // *************************************** UPGRADE HELPERS ***************************************
        /**
         * Checks whether an attachment can be played on a given card.  Intended to be
         * used by cards inheriting this class
         */
        public canPlayOn(card) {
            return true;
        }

        /**
         * Removes an upgrade from this card's upgrade list
         * @param {UpgradeCard} upgrade
         */
        public unattachUpgrade(upgrade) {
            this.assertPropertyEnabled(this._upgrades, 'upgrades');
            this._upgrades = this._upgrades.filter((card) => card.uuid !== upgrade.uuid);
        }

        /**
         * Add the passed card to this card's upgrade list. Upgrade must already be moved to the correct arena.
         */
        public attachUpgrade(upgrade) {
            this.assertPropertyEnabled(this._upgrades, 'upgrades');
            Contract.assertEqual(upgrade.zoneName, this.zoneName);
            Contract.assertTrue(this.zone.hasCard(upgrade));

            this._upgrades.push(upgrade);
        }

        public override leavesPlay() {
            this.unregisterWhenPlayedKeywords();
            // TODO CAPTURE: use this for capture logic
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

            super.leavesPlay();
        }
    };
}
