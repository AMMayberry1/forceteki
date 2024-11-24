import type { AbilityContext } from '../core/ability/AbilityContext';
import { AbilityRestriction, EventName, KeywordName, ZoneName, RelativePlayer, WildcardCardType } from '../core/Constants';
import * as EnumHelpers from '../core/utils/EnumHelpers';
import { type ICardTargetSystemProperties, CardTargetSystem } from '../core/gameSystem/CardTargetSystem';
import { Card } from '../core/card/Card';

export interface IPutIntoPlayProperties extends ICardTargetSystemProperties {
    controller?: RelativePlayer;
    overrideZone?: ZoneName;
    entersReady?: boolean;
}

export class PutIntoPlaySystem<TContext extends AbilityContext = AbilityContext> extends CardTargetSystem<TContext, IPutIntoPlayProperties> {
    public override readonly name = 'putIntoPlay';
    public override readonly eventName = EventName.OnUnitEntersPlay;
    public override readonly costDescription = 'putting {0} into play';

    protected override readonly targetTypeFilter = [WildcardCardType.Unit];
    protected override defaultProperties: IPutIntoPlayProperties = {
        controller: RelativePlayer.Self,
        overrideZone: null,
        entersReady: false
    };


    public eventHandler(event, additionalProperties = {}): void {
        const player = this.getPutIntoPlayPlayer(event.context);

        let finalController = event.context.player;
        if (event.controller === RelativePlayer.Opponent) {
            finalController = finalController.opponent;
        }

        event.card.moveTo(event.card.defaultArena);

        if (event.status === 'ready') {
            event.card.ready();
        } else {
            event.card.exhaust();
        }

        // TODO TAKE CONTROL: fix this, see if other similar systems have the same logic
        // moveCard sets all this stuff and only works if the owner is moving cards, so we're switching it around
        if (event.card.controller !== finalController) {
            event.card.controller = finalController;
            // event.card.setDefaultController(event.card.controller);
            event.card.owner.cardsInPlay.splice(event.card.owner.cardsInPlay.indexOf(event.card), 1);
            event.card.controller.cardsInPlay.push(event.card);
        }
    }

    public override getEffectMessage(context: TContext): [string, any[]] {
        const { target } = this.generatePropertiesFromContext(context);
        return ['put {0} into play', [target]];
    }

    public override canAffect(card: Card, context: TContext): boolean {
        const contextCopy = context.copy({ source: card });
        const player = this.getPutIntoPlayPlayer(contextCopy);
        if (!super.canAffect(card, context)) {
            return false;
        } else if (!card.canBeInPlay() || card.isInPlay()) {
            return false;
        } else if (card.zoneName === ZoneName.Resource && !card.hasSomeKeyword(KeywordName.Smuggle)) {
            return false;
        } else if (card.hasRestriction(AbilityRestriction.EnterPlay, context)) {
            return false;
        } else if (player.hasRestriction(AbilityRestriction.PutIntoPlay, contextCopy)) {
            return false;
        }
        return true;
    }

    protected override addPropertiesToEvent(event, card: Card, context: TContext, additionalProperties): void {
        // TODO:rename this class and all related classes / methods as PutUnitIntoPlay
        const { controller, overrideZone, entersReady } = this.generatePropertiesFromContext(
            context,
            additionalProperties
        ) as IPutIntoPlayProperties;
        super.addPropertiesToEvent(event, card, context, additionalProperties);
        event.controller = controller;
        event.originalZone = overrideZone || card.zoneName;
        event.status = entersReady ? 'ready' : event.status;
    }

    private getPutIntoPlayPlayer(context: AbilityContext) {
        return context.player;
    }
}