import { AbilityContext } from '../core/ability/AbilityContext';
import type { Card } from '../core/card/Card';
import { CardType, GameStateChangeRequired, ZoneName, WildcardCardType, EventName } from '../core/Constants';
import * as EnumHelpers from '../core/utils/EnumHelpers';
import { type ICardTargetSystemProperties, CardTargetSystem } from '../core/gameSystem/CardTargetSystem';
import Player from '../core/Player';

export interface ITakeControlProperties extends ICardTargetSystemProperties {
    newController: Player;
}

/**
 * Used for taking control of a unit in the arena
 */
export class TakeControlOfUnitSystem<TContext extends AbilityContext = AbilityContext, TProperties extends ITakeControlProperties = ITakeControlProperties> extends CardTargetSystem<TContext, TProperties> {
    public override readonly name = 'ready';
    public override readonly eventName = EventName.OnTakeControl;
    protected override readonly targetTypeFilter = [WildcardCardType.Unit, CardType.Event, WildcardCardType.Upgrade];

    public eventHandler(event): void {
        event.card.takeControl(event.newController);
    }

    public override canAffect(card: Card, context: TContext, _additionalProperties: any = {}, mustChangeGameState = GameStateChangeRequired.None): boolean {
        if (![ZoneName.Resource, ZoneName.SpaceArena, ZoneName.GroundArena].includes(card.zoneName)) {
            return false;
        }

        const { newController } = this.generatePropertiesFromContext(context);
        if (mustChangeGameState !== GameStateChangeRequired.None && newController === card.controller) {
            return false;
        }

        return super.canAffect(card, context);
    }

    public override getEffectMessage(context: TContext): [string, any[]] {
        const { newController, target } = this.generatePropertiesFromContext(context);
        return ['{0} takes control of {1}', [newController, target]];
    }

    public override addPropertiesToEvent(event: any, card: Card, context: TContext, additionalProperties?: any): void {
        super.addPropertiesToEvent(event, card, context, additionalProperties);
        event.newController = this.generatePropertiesFromContext(context).newController;
    }
}
