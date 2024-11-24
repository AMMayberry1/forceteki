import AbilityHelper from '../../../AbilityHelper';
import { NonLeaderUnitCard } from '../../../core/card/NonLeaderUnitCard';
import { Trait } from '../../../core/Constants';

export default class ObedientVanguard extends NonLeaderUnitCard {
    protected override getImplementationId() {
        return {
            id: '0249398533',
            internalName: 'obedient-vanguard'
        };
    }

    public override setupCardAbilities() {
        this.addWhenDefeatedAbility({
            title: 'Give a Trooper unit +2/+2 for this phase',
            optional: true,
            targetResolver: {
                cardCondition: (card) => card.isUnit() && card.hasSomeTrait(Trait.Trooper),
                immediateEffect: AbilityHelper.immediateEffects.forThisPhaseCardEffect({
                    effect: AbilityHelper.ongoingEffects.modifyStats({ power: 2, hp: 2 })
                })
            }
        });
    }
}

ObedientVanguard.implemented = true;
