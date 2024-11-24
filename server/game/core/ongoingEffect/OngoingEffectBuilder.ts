import type { AbilityContext } from '../ability/AbilityContext';
import type PlayerOrCardAbility from '../ability/PlayerOrCardAbility';
import type { Card } from '../card/Card';
import type { Duration, EffectName, ZoneName } from '../Constants';
import type Game from '../Game';
import type { GameSystem, IGameSystemProperties } from '../gameSystem/GameSystem';
import type { IOngoingEffectGenerator, IOngoingCardEffectProps, IOngoingEffectProps, IOngoingPlayerEffectProps, WhenType } from '../../Interfaces';
import type Player from '../Player';
// import type { StatusToken } from '../StatusToken';
import { OngoingCardEffect } from './OngoingCardEffect';
// import ConflictEffect from './ConflictEffect';
import DetachedOngoingEffectImpl from './effectImpl/DetachedOngoingEffectImpl';
import DynamicOngoingEffectImpl from './effectImpl/DynamicOngoingEffectImpl';
import { OngoingPlayerEffect } from './OngoingPlayerEffect';
import StaticOngoingEffectImpl from './effectImpl/StaticOngoingEffectImpl';

/* Types of effect
    1. Static effects - do something for a period
    2. Dynamic effects - like static, but what they do depends on the game state
    3. Detached effects - do something when applied, and on expiration, but can be ignored in the interim
*/

export const OngoingEffectBuilder = {
    card: {
        static: (type: EffectName, value?): IOngoingEffectGenerator => (game: Game, source: Card, props: IOngoingCardEffectProps) =>
            new OngoingCardEffect(game, source, props, new StaticOngoingEffectImpl(type, value)),
        dynamic: (type: EffectName, value): IOngoingEffectGenerator => (game: Game, source: Card, props: IOngoingCardEffectProps) =>
            new OngoingCardEffect(game, source, props, new DynamicOngoingEffectImpl(type, value)),
        detached: (type: EffectName, value): IOngoingEffectGenerator => (game: Game, source: Card, props: IOngoingCardEffectProps) =>
            new OngoingCardEffect(game, source, props, new DetachedOngoingEffectImpl(type, value.apply, value.unapply)),
        flexible: (type: EffectName, value?: unknown): IOngoingEffectGenerator =>
            (typeof value === 'function'
                ? OngoingEffectBuilder.card.dynamic(type, value)
                : OngoingEffectBuilder.card.static(type, value))
    },
    player: {
        static: (type: EffectName, value?): IOngoingEffectGenerator => (game: Game, source: Card, props: IOngoingPlayerEffectProps) =>
            new OngoingPlayerEffect(game, source, props, new StaticOngoingEffectImpl(type, value)),
        dynamic: (type: EffectName, value): IOngoingEffectGenerator => (game: Game, source: Card, props: IOngoingPlayerEffectProps) =>
            new OngoingPlayerEffect(game, source, props, new DynamicOngoingEffectImpl(type, value)),
        detached: (type: EffectName, value): IOngoingEffectGenerator => (game: Game, source: Card, props: IOngoingPlayerEffectProps) =>
            new OngoingPlayerEffect(game, source, props, new DetachedOngoingEffectImpl(type, value.apply, value.unapply)),
        flexible: (type: EffectName, value?): IOngoingEffectGenerator =>
            (typeof value === 'function'
                ? OngoingEffectBuilder.player.dynamic(type, value)
                : OngoingEffectBuilder.player.static(type, value))
    }
};
