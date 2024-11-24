import { AbilityContext } from '../core/ability/AbilityContext';
import type { Card } from '../core/card/Card';
import { CardType, GameStateChangeRequired, WildcardCardType, ZoneName } from '../core/Constants';
import * as EnumHelpers from '../core/utils/EnumHelpers';
import { CardTargetSystem, type ICardTargetSystemProperties } from '../core/gameSystem/CardTargetSystem';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IExhaustOrReadyProperties extends ICardTargetSystemProperties {}

export abstract class ExhaustOrReadySystem<TContext extends AbilityContext = AbilityContext, TProperties extends IExhaustOrReadyProperties = IExhaustOrReadyProperties> extends CardTargetSystem<TContext, TProperties> {
    protected override readonly targetTypeFilter = [WildcardCardType.Unit, CardType.Event, WildcardCardType.Upgrade, CardType.Leader];

    public override canAffect(card: Card, context: TContext, additionalProperties: any = {}, mustChangeGameState = GameStateChangeRequired.None): boolean {
        if (
            !EnumHelpers.isArena(card.zoneName) &&
            card.zoneName !== ZoneName.Resource &&
            !(card.isLeader() && card.zoneName === ZoneName.Base)
        ) {
            return false;
        }

        if (!card.canBeExhausted()) {
            return false;
        }

        return super.canAffect(card, context);
    }
}
