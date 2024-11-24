import type { AbilityContext } from '../ability/AbilityContext';
import type { IAbilityLimit } from '../ability/AbilityLimit';
import type { Card } from '../card/Card';
import { PlayType, Aspect, CardTypeFilter, CardType, WildcardCardType } from '../Constants';
import type Game from '../Game';
import type Player from '../Player';
import * as Contract from '../../core/utils/Contract';

export enum CostAdjustType {
    Increase = 'increase',
    Decrease = 'decrease',
    Free = 'free',
    IgnoreAllAspects = 'ignoreAllAspects',
    IgnoreSpecificAspects = 'ignoreSpecificAspect'
}

// TODO: refactor so we can add TContext for attachTargetCondition
interface ICostAdjusterPropertiesBase {

    /** The type of cards that can be reduced */
    cardTypeFilter?: CardTypeFilter;

    /** The type of cost adjustment */
    costAdjustType: CostAdjustType;

    /** The number of cost reductions permitted */
    limit?: IAbilityLimit;

    /** @deprecated (not yet tested) Which playType this reduction is active for */
    playingTypes?: PlayType;

    /** Conditional card matching for things like aspects, traits, etc. */
    match?: (card: Card, adjusterSource: Card) => boolean;

    /** If the cost adjustment is related to upgrades, this creates a condition for the card that the upgrade is being attached to */
    attachTargetCondition?: (attachTarget: Card, adjusterSource: Card, context: AbilityContext) => boolean;
}

export interface IIncreaseOrDecreaseCostAdjusterProperties extends ICostAdjusterPropertiesBase {
    costAdjustType: CostAdjustType.Increase | CostAdjustType.Decrease;

    /** The amount to adjust the cost by */
    amount?: number | ((card: Card, player: Player) => number);
}

export interface IForFreeCostAdjusterProperties extends ICostAdjusterPropertiesBase {
    costAdjustType: CostAdjustType.Free;
}

export interface IIgnoreAllAspectsCostAdjusterProperties extends ICostAdjusterPropertiesBase {
    costAdjustType: CostAdjustType.IgnoreAllAspects;
}

export interface IIgnoreSpecificAspectsCostAdjusterProperties extends ICostAdjusterPropertiesBase {
    costAdjustType: CostAdjustType.IgnoreSpecificAspects;

    /** The aspects to ignore the cost of */
    ignoredAspects: Aspect | Aspect[];
}

export type ICostAdjusterProperties =
  | IIgnoreAllAspectsCostAdjusterProperties
  | IIncreaseOrDecreaseCostAdjusterProperties
  | IForFreeCostAdjusterProperties
  | IIgnoreSpecificAspectsCostAdjusterProperties;

export class CostAdjuster {
    public readonly costAdjustType: CostAdjustType;
    public readonly ignoredAspects: Aspect | Aspect[];
    private amount?: number | ((card: Card, player: Player) => number);
    private match?: (card: Card, adjusterSource: Card) => boolean;
    private cardTypeFilter?: CardTypeFilter;
    private attachTargetCondition?: (attachTarget: Card, adjusterSource: Card, context: AbilityContext<any>) => boolean;
    private limit?: IAbilityLimit;
    private playingTypes?: PlayType[];

    public constructor(
        private game: Game,
        private source: Card,
        properties: ICostAdjusterProperties
    ) {
        this.costAdjustType = properties.costAdjustType;
        if (properties.costAdjustType === CostAdjustType.Increase || properties.costAdjustType === CostAdjustType.Decrease) {
            this.amount = properties.amount || 1;
        }

        if (properties.costAdjustType === CostAdjustType.IgnoreSpecificAspects) {
            if (Array.isArray(properties.ignoredAspects)) {
                Contract.assertTrue(properties.ignoredAspects.length > 0, 'Ignored Aspect array is empty');
            }
            this.ignoredAspects = properties.ignoredAspects;
        }

        this.match = properties.match;
        this.cardTypeFilter = properties.cardTypeFilter ?? WildcardCardType.Any;
        this.attachTargetCondition = properties.attachTargetCondition;

        this.playingTypes =
            properties.playingTypes &&
            (Array.isArray(properties.playingTypes) ? properties.playingTypes : [properties.playingTypes]);

        this.limit = properties.limit;
        if (this.limit) {
            this.limit.registerEvents(game);
        }
    }

    public canAdjust(playingType: PlayType, card: Card, attachTarget?: Card, ignoredAspects?: Aspect): boolean {
        if (this.limit && this.limit.isAtMax(this.source.controller)) {
            return false;
        } else if (this.playingTypes && !this.playingTypes.includes(playingType)) {
            return false;
        } else if (this.ignoredAspects && this.ignoredAspects !== ignoredAspects) {
            return false;
        }
        const context = this.game.getFrameworkContext(card.controller);
        return this.checkMatch(card) && this.checkAttachTargetCondition(context, attachTarget);
    }

    public getAmount(card: Card, player: Player): number {
        return typeof this.amount === 'function' ? this.amount(card, player) : this.amount;
    }

    public markUsed(): void {
        this.limit?.increment(this.source.controller);
    }

    public isExpired(): boolean {
        return !!this.limit && this.limit.isAtMax(this.source.controller) && !this.limit.isRepeatable();
    }

    public unregisterEvents(): void {
        this.limit?.unregisterEvents(this.game);
    }

    private checkMatch(card: Card) {
        return !this.match || this.match(card, this.source);
    }

    private checkAttachTargetCondition(context: AbilityContext, target?: Card) {
        return !this.attachTargetCondition || (target && this.attachTargetCondition(target, this.source, context));
    }
}
