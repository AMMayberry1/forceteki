import AbilityHelper from '../../../AbilityHelper';
import { NonLeaderUnitCard } from '../../../core/card/NonLeaderUnitCard';
import { WildcardCardType } from '../../../core/Constants';

export default class BosskDeadlyStalker extends NonLeaderUnitCard {
    protected override getImplementationId() {
        return {
            id: '0052542605',
            internalName: 'bossk#deadly-stalker',
        };
    }

    public override setupCardAbilities() {
        this.addTriggeredAbility({
            title: 'Deal 2 damage to a unit',
            when: {
                onCardPlayed: (event, context) => event.card.isEvent() && event.card.controller === context.source.controller
            },
            optional: true,
            targetResolver: {
                cardTypeFilter: WildcardCardType.Unit,
                immediateEffect: AbilityHelper.immediateEffects.damage({ amount: 2 }),
            }
        });
    }
}

BosskDeadlyStalker.implemented = true;
