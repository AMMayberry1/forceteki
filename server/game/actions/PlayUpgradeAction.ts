import { AbilityContext } from '../core/ability/AbilityContext';
import { PlayCardContext, PlayCardAction, IPlayCardActionProperties } from '../core/ability/PlayCardAction';
import { UpgradeCard } from '../core/card/UpgradeCard';
import { AbilityRestriction, EventName, PlayType } from '../core/Constants';
import { GameEvent } from '../core/event/GameEvent';
import * as Contract from '../core/utils/Contract';
import { attachUpgrade } from '../gameSystems/GameSystemLibrary';

export class PlayUpgradeAction extends PlayCardAction {
    // we pass in a targetResolver holding the attachUpgrade system so that the action will be blocked if there are no valid targets
    public constructor(properties: IPlayCardActionProperties) {
        super({ ...properties, title: 'Play this upgrade', targetResolver: { immediateEffect: attachUpgrade<AbilityContext<UpgradeCard>>((context) => ({ upgrade: context.source })) } });
    }

    public override executeHandler(context: PlayCardContext) {
        Contract.assertTrue(context.source.isUpgrade());

        const cardPlayedEvent = new GameEvent(EventName.OnCardPlayed, context, {
            player: context.player,
            card: context.source,
            originalZone: context.source.zoneName,
            originallyOnTopOfDeck:
                context.player && context.player.drawDeck && context.player.drawDeck[0] === context.source,
            onPlayCardSource: context.onPlayCardSource,
            playType: context.playType
        });
        const events = [context.game.actions
            .attachUpgrade({
                upgrade: context.source,
                takeControl: context.source.controller !== context.player,
                target: context.target
            })
            .generateEvent(context),
        cardPlayedEvent];

        if (context.playType === PlayType.Smuggle) {
            events.push(this.generateSmuggleEvent(context));
        }

        context.game.openEventWindow(events, this.triggerHandlingMode);
    }

    public override meetsRequirements(context = this.createContext(), ignoredRequirements: string[] = []): string {
        if (
            context.player.hasRestriction(AbilityRestriction.PlayUpgrade, context) ||
            context.player.hasRestriction(AbilityRestriction.PutIntoPlay, context)
        ) {
            return 'restriction';
        }
        return super.meetsRequirements(context, ignoredRequirements);
    }

    public override displayMessage(context: AbilityContext) {
        context.game.addMessage('{0} plays {1}, attaching it to {2}', context.player, context.source, context.target);
    }
}
