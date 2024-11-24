import AbilityHelper from '../../../AbilityHelper';
import { NonLeaderUnitCard } from '../../../core/card/NonLeaderUnitCard';
import { TargetMode, WildcardCardType } from '../../../core/Constants';

export default class LeiaOrganaDefiantPrincess extends NonLeaderUnitCard {
    protected override getImplementationId() {
        return {
            id: '9680213078',
            internalName: 'leia-organa#defiant-princess'
        };
    }

    public override setupCardAbilities() {
        this.addWhenPlayedAbility({
            title: 'Ready a resource or exhaust a unit',
            targetResolver: {
                mode: TargetMode.Select,
                choices: {
                    ['Ready a resource']: AbilityHelper.immediateEffects.readyResources({ amount: 1 }),
                    ['Exhaust a unit']: AbilityHelper.immediateEffects.selectCard({
                        cardTypeFilter: WildcardCardType.Unit,
                        innerSystem: AbilityHelper.immediateEffects.exhaust()
                    })
                }
            }
        });
    }
}

LeiaOrganaDefiantPrincess.implemented = true;
