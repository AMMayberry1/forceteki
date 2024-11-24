import AbilityHelper from '../../../AbilityHelper';
import { NonLeaderUnitCard } from '../../../core/card/NonLeaderUnitCard';
import { TargetMode, WildcardCardType } from '../../../core/Constants';

export default class CoruscantDissident extends NonLeaderUnitCard {
    protected override getImplementationId() {
        return {
            id: '9115773123',
            internalName: 'coruscant-dissident'
        };
    }

    public override setupCardAbilities() {
        this.addOnAttackAbility({
            title: 'Ready a resource',
            optional: true,
            immediateEffect: AbilityHelper.immediateEffects.readyResources((context) => ({
                target: context.source.controller,
                amount: 1
            }))
        });
    }
}

CoruscantDissident.implemented = true;