import type { AbilityContext } from '../AbilityContext';
import BaseAction from '../BaseAction';
import { EffectNames, EventNames, Locations, Phases, PlayTypes, Players } from '../Constants';
import { payReduceableResourceCost } from '../costs/Costs.js';
import { putIntoPlay } from '../gameActions/GameActions';
import type BaseCard from '../card/basecard';
import type Player from '../player';

type ExecutionContext = AbilityContext & { onPlayCardSource: any };

export class PlayUnitAction extends BaseAction {
    public title = 'Play this unit';

    public constructor(card: BaseCard) {
        super(card, payReduceableResourceCost());
    }

    public meetsRequirements(context = this.createContext(), ignoredRequirements: string[] = []): string {
        if (
            !ignoredRequirements.includes('phase') &&
            context.game.currentPhase === Phases.Action
        ) {
            return 'phase';
        }
        if (
            !ignoredRequirements.includes('location') &&
            !context.player.isCardInPlayableLocation(context.source, PlayTypes.PlayFromHand)
        ) {
            return 'location';
        }
        if (
            !ignoredRequirements.includes('cannotTrigger') &&
            !context.source.canPlay(context, PlayTypes.PlayFromHand)
        ) {
            return 'cannotTrigger';
        }
        if (
            !context.player.checkRestrictions('playUnit', context) ||
            !context.player.checkRestrictions('enterPlay', context)
        ) {
            return 'restriction';
        }
        return super.meetsRequirements(context);
    }

    createContext(player: Player = this.card.controller) {
        let context = super.createContext(player);
        context['costAspects'] = this.card.aspects;
        return context;
    }

    public executeHandler(context: ExecutionContext): void {
        const cardPlayedEvent = context.game.getEvent(EventNames.OnCardPlayed, {
            player: context.player,
            card: context.source,
            context: context,
            originalLocation: context.source.location,
            originallyOnTopOfDeck:
                context.player && context.player.deck && context.player.deck.first() === context.source,
            onPlayCardSource: context.onPlayCardSource,
            playType: PlayTypes.PlayFromHand
        });

        context.game.addMessage(
            '{0} plays {1}',
            context.player,
            context.source,
        );
        const effect = context.source.getEffects(EffectNames.EntersPlayForOpponent);
        const player = effect.length > 0 ? Players.Opponent : Players.Self;
        context.game.openEventWindow([
            putIntoPlay({
                controller: player,
                overrideLocation: Locations.Hand        // TODO: should we be doing this?
            }).getEvent(context.source, context),
            cardPlayedEvent
        ]);
    }

    public isCardPlayed(): boolean {
        return true;
    }
}
