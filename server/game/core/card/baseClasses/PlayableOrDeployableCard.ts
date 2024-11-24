import AbilityHelper from '../../../AbilityHelper';
import { IConstantAbilityProps, IOngoingEffectGenerator } from '../../../Interfaces';
import { AbilityContext } from '../../ability/AbilityContext';
import PlayerOrCardAbility from '../../ability/PlayerOrCardAbility';
import { Aspect, CardType, WildcardRelativePlayer, WildcardZoneName, ZoneName, MoveZoneDestination } from '../../Constants';
import { CostAdjustType, ICostAdjusterProperties, IIgnoreAllAspectsCostAdjusterProperties, IIgnoreSpecificAspectsCostAdjusterProperties, IIncreaseOrDecreaseCostAdjusterProperties } from '../../cost/CostAdjuster';
import Player from '../../Player';
import * as Contract from '../../utils/Contract';
import * as EnumHelpers from '../../utils/EnumHelpers';
import { Card } from '../Card';
import { InPlayCard } from './InPlayCard';

// required for mixins to be based on this class
export type PlayableOrDeployableCardConstructor = new (...args: any[]) => PlayableOrDeployableCard;

export interface IDecreaseEventCostAbilityProps<TSource extends Card = Card> extends Omit<IIncreaseOrDecreaseCostAdjusterProperties, 'cardTypeFilter' | 'match' | 'costAdjustType'> {
    title: string;
    condition?: (context: AbilityContext<TSource>) => boolean;
}

export interface IIgnoreAllAspectPenaltiesProps<TSource extends Card = Card> extends Omit<IIgnoreAllAspectsCostAdjusterProperties, 'cardTypeFilter' | 'match' | 'costAdjustType'> {
    title: string;
    condition?: (context: AbilityContext<TSource>) => boolean;
}

export interface IIgnoreSpecificAspectPenaltyProps<TSource extends Card = Card> extends Omit<IIgnoreSpecificAspectsCostAdjusterProperties, 'cardTypeFilter' | 'match' | 'costAdjustType'> {
    title: string;
    ignoredAspects: Aspect | Aspect[];
    condition?: (context: AbilityContext<TSource>) => boolean;
}

/**
 * Subclass of {@link Card} that represents shared features of all non-base cards.
 * Implements the basic pieces for a card to be able to be played (non-leader) or deployed (leader),
 * as well as exhausted status.
 */
export class PlayableOrDeployableCard extends Card {
    /**
         * List of actions that the player can take with this card that aren't printed text abilities.
         * Typical examples are playing / deploying cards and attacking.
         */
    protected defaultActions: PlayerOrCardAbility[] = [];

    private _exhausted?: boolean = null;

    public get exhausted(): boolean {
        this.assertPropertyEnabled(this._exhausted, 'exhausted');
        return this._exhausted;
    }

    public set exhausted(val: boolean) {
        this.assertPropertyEnabled(this._exhausted, 'exhausted');
        this._exhausted = val;
    }

    // see Card constructor for list of expected args
    public constructor(owner: Player, cardData: any) {
        super(owner, cardData);

        // this class is for all card types other than Base
        Contract.assertFalse(this.printedType === CardType.Base);
    }

    public override getActions(): PlayerOrCardAbility[] {
        return this.defaultActions.concat(super.getActions());
    }

    public exhaust() {
        this.assertPropertyEnabled(this._exhausted, 'exhausted');
        this._exhausted = true;
    }

    public ready() {
        this.assertPropertyEnabled(this._exhausted, 'exhausted');
        this._exhausted = false;
    }

    public override moveTo(targetZone: MoveZoneDestination, resetController?: boolean): void {
        // If this card is a resource and it is ready, try to ready another resource instead
        // and exhaust this one. This should be the desired behavior for most cases.
        if (this.zoneName === ZoneName.Resource && !this.exhausted) {
            this.controller.swapResourceReadyState(this);
        }

        super.moveTo(targetZone, resetController);
    }

    public override canBeExhausted(): this is PlayableOrDeployableCard {
        return true;
    }

    public override getSummary(activePlayer: Player, hideWhenFaceup?: boolean) {
        return { ...super.getSummary(activePlayer, hideWhenFaceup), exhausted: this._exhausted };
    }

    protected setExhaustEnabled(enabledStatus: boolean) {
        this._exhausted = enabledStatus ? true : null;
    }

    /**
     * The passed player takes control of this card. If `moveTo` is provided, the card will be moved to that zone under the
     * player's control. If not, it will move to the same zone type it currently occupies but under the new controller.
     *
     * For example, if the card is current in the resource zone and `moveTo` is not provided, it will move to the new
     * controller's resource zone.
     *
     * If `newController` is the same as the current controller, nothing happens.
     */
    public takeControl(newController: Player, moveTo: ZoneName.SpaceArena | ZoneName.GroundArena | ZoneName.Resource = null) {
        if (newController === this.controller) {
            return;
        }

        this._controller = newController;

        const moveDestination = moveTo || this.zone.name;

        Contract.assertTrue(
            moveDestination === ZoneName.SpaceArena || moveDestination === ZoneName.GroundArena || moveDestination === ZoneName.Resource,
            `Attempting to take control of card ${this.internalName} for player ${newController.name} in invalid zone: ${moveDestination}`
        );

        // if we're changing controller and staying in the arena, just tell the arena to update our controller. no move needed
        if (moveDestination === this.zoneName && (this.zone.name === ZoneName.GroundArena || this.zone.name === ZoneName.SpaceArena)) {
            this.zone.updateController(this);

            // register this transition with the engine so it can do uniqueness check if needed
            this.game.registerMovedCard(this);
        } else {
            this.moveTo(moveDestination, false);
        }

        // update the context of all constant abilities so they are aware of the new controller
        for (const constantAbility of this.constantAbilities) {
            if (constantAbility.registeredEffects) {
                for (const effect of constantAbility.registeredEffects) {
                    effect.refreshContext();
                }
            }
        }
    }

    /** Create constant ability props on the card that decreases its cost under the given condition */
    protected generateDecreaseCostAbilityProps(properties: IDecreaseEventCostAbilityProps<this>): IConstantAbilityProps {
        const { title, condition, ...otherProps } = properties;

        const costAdjusterProps: ICostAdjusterProperties = {
            ...this.buildCostAdjusterGenericProperties(),
            costAdjustType: CostAdjustType.Decrease,
            ...otherProps
        };

        const effect = AbilityHelper.ongoingEffects.decreaseCost(costAdjusterProps);
        return this.buildCostAdjusterAbilityProps(condition, title, effect);
    }


    /** Create constant ability props on the card that decreases its cost under the given condition */
    protected generateIgnoreAllAspectPenaltiesAbilityProps(properties: IIgnoreAllAspectPenaltiesProps<this>): IConstantAbilityProps {
        const { title, condition, ...otherProps } = properties;

        const costAdjusterProps: ICostAdjusterProperties = {
            ...this.buildCostAdjusterGenericProperties(),
            costAdjustType: CostAdjustType.IgnoreAllAspects,
            ...otherProps
        };

        const effect = AbilityHelper.ongoingEffects.ignoreAllAspectPenalties(costAdjusterProps);
        return this.buildCostAdjusterAbilityProps(condition, title, effect);
    }


    /** Create constant ability props on the card that decreases its cost under the given condition */
    protected generateIgnoreSpecificAspectPenaltiesAbilityProps(properties: IIgnoreSpecificAspectPenaltyProps<this>): IConstantAbilityProps {
        const { title, ignoredAspects, condition, ...otherProps } = properties;

        const costAdjusterProps: ICostAdjusterProperties = {
            ...this.buildCostAdjusterGenericProperties(),
            costAdjustType: CostAdjustType.IgnoreSpecificAspects,
            ignoredAspects: ignoredAspects,
            ...otherProps
        };

        const effect = AbilityHelper.ongoingEffects.ignoreSpecificAspectPenalties(costAdjusterProps);
        return this.buildCostAdjusterAbilityProps(condition, title, effect);
    }

    private buildCostAdjusterGenericProperties() {
        return {
            cardTypeFilter: this.printedType,
            match: (card, adjusterSource) => card === adjusterSource
        };
    }

    private buildCostAdjusterAbilityProps(condition: (context: AbilityContext<this>) => boolean, title: string, ongoingEffect: IOngoingEffectGenerator): IConstantAbilityProps {
        const costAdjustAbilityProps: IConstantAbilityProps = {
            title,
            sourceZoneFilter: WildcardZoneName.Any,
            targetController: WildcardRelativePlayer.Any,
            condition,
            ongoingEffect
        };

        return costAdjustAbilityProps;
    }
}