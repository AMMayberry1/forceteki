import AbilityHelper from '../../../AbilityHelper';
import { NonLeaderUnitCard } from '../../../core/card/NonLeaderUnitCard';

export default class AquitensAssaultCruiser extends NonLeaderUnitCard {
    protected override getImplementationId() {
        return {
            id: '1086021299',
            internalName: 'arquitens-assault-cruiser',
        };
    }

    public override setupCardAbilities() {
        this.addTriggeredAbility({
            title: 'Put the defeated unit into play as a resource under your control',
            when: {
                onCardDefeated: (event, context) =>
                    // TODO: update trigger condition so that defender being defeated by attacker at the 'on attack' stage will also work
                    event.isDefeatedByAttackerDamage &&
                    event.card.isNonLeaderUnit() &&
                    event.defeatSource.attack.attacker === context.source
            },
            immediateEffect: AbilityHelper.immediateEffects.resourceCard((context) => ({ target: context.event.card }))
        });
    }
}

AquitensAssaultCruiser.implemented = true;
