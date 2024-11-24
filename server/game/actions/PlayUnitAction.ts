import { AbilityRestriction, EffectName, EventName, PlayType, RelativePlayer } from '../core/Constants.js';
import { putIntoPlay } from '../gameSystems/GameSystemLibrary.js';
import { GameEvent } from '../core/event/GameEvent.js';
import { PlayCardAction, PlayCardContext, IPlayCardActionProperties } from '../core/ability/PlayCardAction.js';
import * as Contract from '../core/utils/Contract.js';

export interface IPlayUnitActionProperties extends IPlayCardActionProperties {
    entersReady?: boolean;
}

export class PlayUnitAction extends PlayCardAction {
    private entersReady: boolean;

    public constructor(properties: IPlayUnitActionProperties) {
        super({ ...properties, title: 'Play this unit' });

        // default to false
        this.entersReady = !!properties.entersReady;
    }

    public override executeHandler(context: PlayCardContext): void {
        Contract.assertTrue(context.source.isUnit());

        const cardPlayedEvent = new GameEvent(EventName.OnCardPlayed, context, {
            player: context.player,
            card: context.source,
            originalZone: context.source.zoneName,
            originallyOnTopOfDeck:
                context.player && context.player.drawDeck && context.player.drawDeck[0] === context.source,
            onPlayCardSource: context.onPlayCardSource,
            playType: context.playType
        });

        context.game.addMessage(
            '{0} plays {1}',
            context.player,
            context.source,
        );

        // TODO TAKE CONTROL
        const playForOpponentEffect = context.source.getOngoingEffectValues(EffectName.EntersPlayForOpponent);
        const player = playForOpponentEffect.length > 0 ? RelativePlayer.Opponent : RelativePlayer.Self;
        const entersReady = this.entersReady || context.source.hasOngoingEffect(EffectName.EntersPlayReady);

        const events = [
            putIntoPlay({ target: context.source, controller: player, entersReady: entersReady }).generateEvent(context),
            cardPlayedEvent
        ];

        if (context.playType === PlayType.Smuggle) {
            events.push(this.generateSmuggleEvent(context));
        }

        context.game.openEventWindow(events, this.triggerHandlingMode);
    }

    public override meetsRequirements(context = this.createContext(), ignoredRequirements: string[] = []): string {
        if (
            context.player.hasRestriction(AbilityRestriction.PlayUnit, context) ||
            context.player.hasRestriction(AbilityRestriction.PutIntoPlay, context) ||
            context.source.hasRestriction(AbilityRestriction.EnterPlay, context)
        ) {
            return 'restriction';
        }
        return super.meetsRequirements(context, ignoredRequirements);
    }
}
