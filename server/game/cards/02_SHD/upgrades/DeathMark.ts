import AbilityHelper from '../../../AbilityHelper';
import { UpgradeCard } from '../../../core/card/UpgradeCard';
import { KeywordName } from '../../../core/Constants';

export default class DeathMark extends UpgradeCard {
    protected override getImplementationId() {
        return {
            id: '0807120264',
            internalName: 'death-mark',
        };
    }

    public override setupCardAbilities() {
        this.addGainKeywordTargetingAttached({
            keyword: KeywordName.Bounty,
            ability: {
                title: 'Draw 2 cards',
                immediateEffect: AbilityHelper.immediateEffects.draw({ amount: 2 }),
            }
        });
    }
}

DeathMark.implemented = true;
