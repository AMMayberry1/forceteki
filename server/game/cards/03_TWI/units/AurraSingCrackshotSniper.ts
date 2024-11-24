import AbilityHelper from '../../../AbilityHelper';
import { NonLeaderUnitCard } from '../../../core/card/NonLeaderUnitCard';

export default class AurraSingCrackshotSniper extends NonLeaderUnitCard {
    protected override getImplementationId() {
        return {
            id: '3693364726',
            internalName: 'aurra-sing#crackshot-sniper'
        };
    }

    public override setupCardAbilities() {
        this.addTriggeredAbility({
            title: 'Give a Shield token to a friendly unit in the same arena as the attacker',
            when: {
                onAttackDeclared: (event, context) => event.attack.target === context.source.controller.base,
            },
            immediateEffect: AbilityHelper.immediateEffects.ready(),
        });
    }
}

AurraSingCrackshotSniper.implemented = true;
