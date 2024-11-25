import AbilityHelper from '../../../AbilityHelper';
import { NonLeaderUnitCard } from '../../../core/card/NonLeaderUnitCard';
import { RelativePlayer, WildcardCardType } from '../../../core/Constants';

export default class EnfysNestChampionOfJustice extends NonLeaderUnitCard {
    protected override getImplementationId() {
        return {
            id: '8414572243',
            internalName: 'enfys-nest#champion-of-justice',
        };
    }

    public override setupCardAbilities() {
        this.addTriggeredAbility({
            title: 'Return an enemy non-leader unit with less power than this unit to its owner\'s hand',
            when: {
                onCardPlayed: (event, context) => event.card === context.source,
                onAttackDeclared: (event, context) => event.attack.attacker === context.source,
            },
            optional: true,
            targetResolver: {
                controller: RelativePlayer.Opponent,
                cardTypeFilter: WildcardCardType.NonLeaderUnit,
                cardCondition: (card, context) => card.isUnit() && card.getPower() < context.source.getPower(),
                immediateEffect: AbilityHelper.immediateEffects.returnToHand()
            }
        });
    }
}

EnfysNestChampionOfJustice.implemented = true;
