import { AbilityContext } from '../core/ability/AbilityContext';
import { Card } from '../core/card/Card';
import { UnitCard } from '../core/card/CardTypes';
import { UpgradeCard } from '../core/card/UpgradeCard';
import { AbilityRestriction, CardTypeFilter, EventName, WildcardCardType } from '../core/Constants';
import { CardTargetSystem, ICardTargetSystemProperties } from '../core/gameSystem/CardTargetSystem';
import * as Contract from '../core/utils/Contract';
import * as EnumHelpers from '../core/utils/EnumHelpers';

export interface IAttachUpgradeProperties extends ICardTargetSystemProperties {
    upgrade?: UpgradeCard;
    // TODO TAKE CONTROL: use these as-is?
    takeControl?: boolean;
    giveControl?: boolean;
    controlSwitchOptional?: boolean;
}

export class AttachUpgradeSystem<TContext extends AbilityContext = AbilityContext> extends CardTargetSystem<TContext, IAttachUpgradeProperties> {
    public override readonly name = 'attach';
    public override readonly eventName = EventName.OnUpgradeAttached;
    protected override readonly targetTypeFilter: CardTypeFilter[] = [WildcardCardType.Unit];
    protected override readonly defaultProperties: IAttachUpgradeProperties = {
        takeControl: false,
        giveControl: false,
    };

    public override eventHandler(event, additionalProperties = {}): void {
        const upgradeCard = (event.upgradeCard as Card);
        const parentCard = (event.parentCard as Card);

        Contract.assertTrue(upgradeCard.isUpgrade());
        Contract.assertTrue(parentCard.isUnit());

        const properties = this.generatePropertiesFromContext(event.context, additionalProperties);
        event.originalZone = upgradeCard.zoneName;

        // attachTo manages all of the unattach and move zone logic
        upgradeCard.attachTo(parentCard);

        // TODO: add a system for taking control of upgrades
        // if (properties.takeControl) {
        //     upgradeCard.controller = event.context.player;
        //     upgradeCard.updateConstantAbilityContexts();
        // } else if (properties.giveControl) {
        //     upgradeCard.controller = event.context.player.opponent;
        //     upgradeCard.updateConstantAbilityContexts();
        // }
    }

    public override getEffectMessage(context: TContext): [string, any[]] {
        const properties = this.generatePropertiesFromContext(context);
        if (properties.takeControl) {
            return [
                'take control of and attach {2}\'s {1} to {0}',
                [properties.target, properties.upgrade, properties.upgrade.parentCard]
            ];
        } else if (properties.giveControl) {
            return [
                'give control of and attach {2}\'s {1} to {0}',
                [properties.target, properties.upgrade, properties.upgrade.parentCard]
            ];
        }
        return ['attach {1} to {0}', [properties.target, properties.upgrade]];
    }

    public override canAffect(card: Card, context: TContext, additionalProperties = {}): boolean {
        const properties = this.generatePropertiesFromContext(context, additionalProperties);
        const contextCopy = context.copy({ source: card });

        Contract.assertNotNullLike(context);
        Contract.assertNotNullLike(context.player);
        Contract.assertNotNullLike(card);
        Contract.assertNotNullLike(properties.upgrade);

        if (!card.isUnit()) {
            return false;
        }
        if (!properties.upgrade.canAttach(card, this.getFinalController(properties, context))) {
            return false;
        } else if (
            properties.takeControl &&
            properties.upgrade.controller === context.player
        ) {
            return false;
        } else if (
            properties.giveControl &&
            properties.upgrade.controller !== context.player
        ) {
            return false;
        } else if (card.hasRestriction(AbilityRestriction.EnterPlay, context)) {
            return false;
        } else if (context.player.hasRestriction(AbilityRestriction.PutIntoPlay, contextCopy)) {
            return false;
        }
        return super.canAffect(card, context);
    }

    public override checkEventCondition(event, additionalProperties): boolean {
        return this.canAffect(event.parentCard, event.context, additionalProperties);
    }

    protected override addPropertiesToEvent(event, card: Card, context: TContext, additionalProperties): void {
        super.addPropertiesToEvent(event, card, context, additionalProperties);

        const { upgrade } = this.generatePropertiesFromContext(context, additionalProperties);
        event.parentCard = card;
        event.upgradeCard = upgrade;
    }

    private getFinalController(properties, context) {
        if (properties.takeControl) {
            return context.player;
        } else if (properties.giveControl) {
            return context.player.opponent;
        }

        return properties.upgrade.controller;
    }
}