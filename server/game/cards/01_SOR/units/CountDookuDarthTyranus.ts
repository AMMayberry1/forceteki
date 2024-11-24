import AbilityHelper from '../../../AbilityHelper';
import { NonLeaderUnitCard } from '../../../core/card/NonLeaderUnitCard';

export default class CountDookuDarthTyranus extends NonLeaderUnitCard {
    protected override getImplementationId() {
        return {
            id: '9624333142',
            internalName: 'count-dooku#darth-tyranus'
        };
    }

    public override setupCardAbilities() {
        this.addWhenPlayedAbility({
            title: 'Defeat a unit with 4 or less remaining HP',
            optional: true,
            targetResolver: {
                cardCondition: (card) => card.isUnit() && card.remainingHp <= 4,
                immediateEffect: AbilityHelper.immediateEffects.defeat()
            }
        });
    }
}

CountDookuDarthTyranus.implemented = true;
