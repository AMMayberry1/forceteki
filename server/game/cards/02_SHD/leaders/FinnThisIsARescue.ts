import AbilityHelper from '../../../AbilityHelper';
import { LeaderUnitCard } from '../../../core/card/LeaderUnitCard';
import { RelativePlayer, WildcardCardType } from '../../../core/Constants';

export default class FinnThisIsARescue extends LeaderUnitCard {
    protected override getImplementationId () {
        return {
            id: '9596662994',
            internalName: 'finn#this-is-a-rescue',
        };
    }

    protected override setupLeaderSideAbilities () {
        this.addActionAbility({
            title: 'Defeat a friendly upgrade on a unit',
            cost: [AbilityHelper.costs.exhaustSelf()],
            targetResolver: {
                cardTypeFilter: WildcardCardType.Upgrade,
                cardCondition: (card, context) => card.controller === context.source.controller,
                immediateEffect: AbilityHelper.immediateEffects.simultaneous([
                    // TODO: this is a hack to store the parent card of the upgrade before it's defeated.
                    // once last known state is implemented, we need to read the upgrade's parent card from that (same for on-attack)
                    AbilityHelper.immediateEffects.handler((context) => ({
                        handler: () => context.targets.upgradeParentCard = context.target.parentCard
                    })),
                    AbilityHelper.immediateEffects.defeat()
                ]),
            },
            ifYouDo: (ifYouDoContext) => ({
                title: 'Give a Shield token to that unit',
                immediateEffect: AbilityHelper.immediateEffects.giveShield({ target: ifYouDoContext.targets.upgradeParentCard }),
            })
        });
    }

    protected override setupLeaderUnitSideAbilities () {
        this.addOnAttackAbility({
            title: 'Defeat a friendly upgrade on a unit',
            optional: true,
            targetResolver: {
                cardTypeFilter: WildcardCardType.Upgrade,
                cardCondition: (card, context) => card.controller === context.source.controller,
                immediateEffect: AbilityHelper.immediateEffects.simultaneous([
                    AbilityHelper.immediateEffects.handler((context) => ({
                        handler: () => context.targets.upgradeParentCard = context.target.parentCard
                    })),
                    AbilityHelper.immediateEffects.defeat()
                ]),
            },
            ifYouDo: (ifYouDoContext) => ({
                title: 'Give a Shield token to that unit',
                immediateEffect: AbilityHelper.immediateEffects.giveShield({ target: ifYouDoContext.targets.upgradeParentCard }),
            })
        });
    }
}

FinnThisIsARescue.implemented = true;
