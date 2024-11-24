import AbilityHelper from '../../../AbilityHelper';
import { UpgradeCard } from '../../../core/card/UpgradeCard';
import { KeywordName, WildcardRelativePlayer } from '../../../core/Constants';
import { TargetMode } from '../../../core/Constants';

export default class RichReward extends UpgradeCard {
    protected override getImplementationId() {
        return {
            id: '3074091930',
            internalName: 'rich-reward'
        };
    }

    public override setupCardAbilities() {
        this.addGainKeywordTargetingAttached({
            keyword: KeywordName.Bounty,
            ability: {
                title: 'Give an Experience token to each of up to 2 units',
                targetResolver: {
                    mode: TargetMode.UpTo,
                    numCards: 2,
                    controller: WildcardRelativePlayer.Any,
                    immediateEffect: AbilityHelper.immediateEffects.giveExperience()
                }
            }
        });
    }
}

RichReward.implemented = true;