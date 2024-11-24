import type { AbilityContext } from '../core/ability/AbilityContext';
import type { Card } from '../core/card/Card';
import { CardType, EffectName, EventName, ZoneName, RelativePlayer, WildcardCardType, WildcardRelativePlayer } from '../core/Constants';
import * as EnumHelpers from '../core/utils/EnumHelpers';
import { type ICardTargetSystemProperties, CardTargetSystem } from '../core/gameSystem/CardTargetSystem';
import { ready } from './GameSystemLibrary';
import * as Contract from '../core/utils/Contract';
import { GameEvent } from '../core/event/GameEvent';

export interface IResourceCardProperties extends ICardTargetSystemProperties {
    // TODO: remove completely if faceup logic is not needed
    // faceup?: boolean;
    targetPlayer?: RelativePlayer;
    readyResource?: boolean;
}

export class ResourceCardSystem<TContext extends AbilityContext = AbilityContext> extends CardTargetSystem<TContext, IResourceCardProperties> {
    public override readonly name = 'resource';
    public override targetTypeFilter = [WildcardCardType.Unit, WildcardCardType.Upgrade, CardType.Event];
    protected override readonly eventName = EventName.OnCardResourced;

    protected override defaultProperties: IResourceCardProperties = {
        // TODO: remove completely if faceup logic is not needed
        // faceup: false,
        targetPlayer: RelativePlayer.Self,
        readyResource: false
    };

    public eventHandler(event: any, additionalProperties = {}): void {
        // TODO: remove this completely if determined we don't need card snapshots
        // event.cardStateWhenMoved = card.createSnapshot();

        const card = event.card as Card;
        Contract.assertTrue(card.isTokenOrPlayable());
        Contract.assertFalse(card.isToken());

        if (event.resourceControllingPlayer !== card.controller) {
            card.takeControl(event.resourceControllingPlayer, ZoneName.Resource);
        } else {
            card.moveTo(ZoneName.Resource);
        }
    }

    public override generatePropertiesFromContext(context: TContext, additionalProperties = {}): IResourceCardProperties {
        const properties = super.generatePropertiesFromContext(context, additionalProperties);

        if (Array.isArray(properties.target)) {
            Contract.assertTrue(properties.target.length <= 1, 'Resourcing more than 1 card is not yet supported');
        }
        return properties;
    }

    public override updateEvent(event: GameEvent, target: any, context: TContext, additionalProperties?: any): void {
        const properties = this.generatePropertiesFromContext(context, additionalProperties) as IResourceCardProperties;
        const card = Array.isArray(properties.target) ? properties.target[0] as Card : properties.target as Card;

        if (properties.readyResource) {
            event.setContingentEventsGenerator((event) => {
                return [ready({ target: card }).generateEvent(context)];
            });
        }
        super.updateEvent(event, target, context, additionalProperties);
    }

    public override getCostMessage(context: TContext): [string, any[]] {
        const properties = this.generatePropertiesFromContext(context) as IResourceCardProperties;
        return ['moving {0} to resources', [properties.target]];
    }

    public override getEffectMessage(context: TContext): [string, any[]] {
        const properties = this.generatePropertiesFromContext(context) as IResourceCardProperties;
        const card = Array.isArray(properties.target) ? properties.target[0] as Card : properties.target as Card;

        const destinationController = properties.targetPlayer === RelativePlayer.Opponent ? card.controller.opponent : card.controller;
        return [
            'move {0} to {1}\'s resources',
            [properties.target, destinationController]
        ];
    }

    public override addPropertiesToEvent(event: any, card: Card, context: TContext, additionalProperties?: any): void {
        const properties = this.generatePropertiesFromContext(context, additionalProperties);
        super.addPropertiesToEvent(event, card, context, additionalProperties);

        event.resourceControllingPlayer = this.getResourceControllingPlayer(properties, context);
    }

    public override canAffect(card: Card, context: TContext, additionalProperties = {}): boolean {
        const { targetPlayer } = this.generatePropertiesFromContext(context, additionalProperties) as IResourceCardProperties;

        const resourceControllingPlayer = this.getResourceControllingPlayer({ targetPlayer }, context);

        if (resourceControllingPlayer !== card.controller && card.hasRestriction(EffectName.TakeControl, context)) {
            return false;
        }

        if (!context.player.isLegalZoneForCardType(card.type, ZoneName.Resource)) {
            return false;
        }

        return super.canAffect(card, context);
    }

    private getResourceControllingPlayer(properties: IResourceCardProperties, context: TContext) {
        return properties.targetPlayer === RelativePlayer.Self ? context.player : context.player.opponent;
    }
}
