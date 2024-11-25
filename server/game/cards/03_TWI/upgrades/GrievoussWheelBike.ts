import { UpgradeCard } from '../../../core/card/UpgradeCard';
import { KeywordName, Trait } from '../../../core/Constants';
import { Card } from '../../../core/card/Card';

export default class GrievoussWheelBike extends UpgradeCard {
    protected override getImplementationId() {
        return {
            id: '0875550518',
            internalName: 'grievouss-wheel-bike',
        };
    }

    public override setupCardAbilities() {
        this.setAttachCondition((card: Card) => !card.hasSomeTrait(Trait.Vehicle));

        this.addGainKeywordTargetingAttached({ keyword: KeywordName.Overwhelm });

        this.addDecreaseCostAbility({
            title: 'While playing this upgrade on General Grievous, it costs 2 resources less to play',
            amount: 2,
            attachTargetCondition: (card) => card.title === 'General Grievous'
        });
    }
}

GrievoussWheelBike.implemented = true;
