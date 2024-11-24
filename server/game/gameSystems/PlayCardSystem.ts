import type { Card } from '../core/card/Card';
import AbilityResolver from '../core/gameSteps/AbilityResolver';
import { CardTargetSystem, ICardTargetSystemProperties } from '../core/gameSystem/CardTargetSystem';
import { AbilityContext } from '../core/ability/AbilityContext';
import * as Contract from '../core/utils/Contract';
import { CardType, PlayType, MetaEventName } from '../core/Constants';
import { PlayCardAction } from '../core/ability/PlayCardAction';
import { PlayUnitAction } from '../actions/PlayUnitAction';
import { PlayUpgradeAction } from '../actions/PlayUpgradeAction';
import { PlayEventAction } from '../actions/PlayEventAction';
import { TriggerHandlingMode } from '../core/event/EventWindow';
import { CostAdjuster, ICostAdjusterProperties } from '../core/cost/CostAdjuster';

export interface IPlayCardProperties extends ICardTargetSystemProperties {
    ignoredRequirements?: string[];

    /** By default, the system will inherit the `optional` property from the activating ability. Use this to override the behavior. */
    optional?: boolean;
    entersReady?: boolean;
    playType?: PlayType;
    adjustCost?: ICostAdjusterProperties;
    // TODO: implement a "nested" property that controls whether triggered abilities triggered by playing the card resolve after that card play or after the whole ability
}

// TODO: implement playing with smuggle and from non-standard zones(discard(e.g. Palpatine's Return), top of deck(e.g. Ezra Bridger), etc.) as part of abilties with another function(s)
/**
 * This system is a helper for playing cards from abilities (see {@link GameSystemLibrary.playCard}).
 */
export class PlayCardSystem<TContext extends AbilityContext = AbilityContext> extends CardTargetSystem<TContext, IPlayCardProperties> {
    public override readonly name = 'playCard';
    public override readonly eventName = MetaEventName.PlayCard;
    protected override readonly targetTypeFilter = [CardType.BasicUnit, CardType.BasicUpgrade, CardType.Event];
    protected override readonly defaultProperties: IPlayCardProperties = {
        ignoredRequirements: [],
        optional: false,
        entersReady: false,
        playType: PlayType.PlayFromHand
    };

    public eventHandler(event, additionalProperties): void {
        const player = event.player;
        const newContext = (event.playCardAbility as PlayCardAction).createContext(player);

        event.context.game.queueStep(new AbilityResolver(event.context.game, newContext, event.optional));
    }

    public override getEffectMessage(context: TContext): [string, any[]] {
        const properties = this.generatePropertiesFromContext(context);
        return ['play {0}', [properties.target]];
    }

    protected override addPropertiesToEvent(event, target, context: TContext, additionalProperties = {}): void {
        const properties = this.generatePropertiesFromContext(context, additionalProperties);

        super.addPropertiesToEvent(event, target, context, additionalProperties);

        event.playCardAbility = this.generatePlayCardAbility(target, properties, context);
        event.optional = properties.optional ?? context.ability.optional;
    }

    public override canAffect(card: Card, context: TContext, additionalProperties = {}): boolean {
        if (!card.isTokenOrPlayable() || card.isToken()) {
            return false;
        }
        const properties = this.generatePropertiesFromContext(context, additionalProperties);
        if (!super.canAffect(card, context)) {
            return false;
        }

        const playCardAbility = this.generatePlayCardAbility(card, properties, context);
        const newContext = playCardAbility.createContext(context.player);

        return !playCardAbility.meetsRequirements(newContext, properties.ignoredRequirements);
    }

    private makeCostAdjuster(properties: ICostAdjusterProperties | null, context: TContext) {
        return properties ? new CostAdjuster(context.game, context.source, properties) : null;
    }

    /**
     * Generate a play card ability for the specified card.
     */
    private generatePlayCardAbility(card: Card, properties: IPlayCardProperties, context: TContext) {
        const actionProperties = { card, playType: properties.playType, triggerHandlingMode: TriggerHandlingMode.ResolvesTriggers, costAdjuster: this.makeCostAdjuster(properties.adjustCost, context) };
        switch (actionProperties.card.type) {
            case CardType.BasicUnit: return new PlayUnitAction({ ...actionProperties, entersReady: properties.entersReady });
            case CardType.BasicUpgrade: return new PlayUpgradeAction(actionProperties);
            case CardType.Event: return new PlayEventAction(actionProperties);
            default: Contract.fail(`Attempted to play a card with invalid type ${actionProperties.card.type} as part of an ability`);
        }
    }
}
