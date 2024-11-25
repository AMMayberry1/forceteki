import AbilityHelper from '../../../AbilityHelper';
import { UpgradeCard } from '../../../core/card/UpgradeCard';
import { AbilityRestriction } from '../../../core/Constants';

export default class OnTopOfThings extends UpgradeCard {
    protected override getImplementationId() {
        return {
            id: '2012334456',
            internalName: 'on-top-of-things',
        };
    }

    public override setupCardAbilities() {
        this.addWhenPlayedAbility({
            title: 'Attached unit can not be attacked this phase (unless it has Sentinel)',
            immediateEffect: AbilityHelper.immediateEffects.forThisPhaseCardEffect((context) => ({
                target: context.source.parentCard,
                effect: AbilityHelper.ongoingEffects.cardCannot(AbilityRestriction.BeAttacked)
            }))
        });
    }
}

OnTopOfThings.implemented = true;
