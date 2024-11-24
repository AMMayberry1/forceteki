import AbilityHelper from '../../../AbilityHelper';
import { UpgradeCard } from '../../../core/card/UpgradeCard';
import { KeywordName, TargetMode, WildcardCardType } from '../../../core/Constants';

export default class EnticingReward extends UpgradeCard {
    protected override getImplementationId() {
        return {
            id: '6420322033',
            internalName: 'enticing-reward',
        };
    }

    public override setupCardAbilities() {
        this.addGainKeywordTargetingAttached({
            keyword: KeywordName.Bounty,
            ability: {
                title: 'Search the top 10 cards of your deck for 2 non-unit cards, reveal them, and draw them.',
                immediateEffect: AbilityHelper.immediateEffects.deckSearch({
                    targetMode: TargetMode.UpTo,
                    selectCount: 2,
                    searchCount: 10,
                    cardCondition: (card) => !card.isUnit(),
                    selectedCardsImmediateEffect: AbilityHelper.immediateEffects.drawSpecificCard()
                }),
                then: {
                    title: 'If this unit isn’t unique, discard a card from your hand',
                    immediateEffect: AbilityHelper.immediateEffects.conditional({
                        condition: (context) => !context.source.unique,
                        onTrue: AbilityHelper.immediateEffects.discardCardsFromOwnHand((context) => ({
                            cardTypeFilter: WildcardCardType.Any,
                            target: context.player,
                            amount: 1
                        })),
                        onFalse: AbilityHelper.immediateEffects.noAction()
                    })
                }
            }
        });
    }
}

EnticingReward.implemented = true;
