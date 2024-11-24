import AbilityHelper from '../../../AbilityHelper';
import { NonLeaderUnitCard } from '../../../core/card/NonLeaderUnitCard';
import { WildcardCardType } from '../../../core/Constants';

export default class FreelanceAssassin extends NonLeaderUnitCard {
    protected override getImplementationId() {
        return {
            id: '8839068683',
            internalName: 'freelance-assassin'
        };
    }

    public override setupCardAbilities() {
        this.addWhenPlayedAbility({
            title: 'Pay 2 resources. If you do, deal 2 damage to a unit.',
            optional: true,
            immediateEffect: AbilityHelper.immediateEffects.payResourceCost((context) => ({
                amount: 2,
                target: context.source.controller
            })),
            ifYouDo: {
                title: 'Deal 2 damage to a unit',
                targetResolver: {
                    cardTypeFilter: WildcardCardType.Unit,
                    immediateEffect: AbilityHelper.immediateEffects.damage({ amount: 2 })
                }
            }
        });
    }
}

FreelanceAssassin.implemented = true;
