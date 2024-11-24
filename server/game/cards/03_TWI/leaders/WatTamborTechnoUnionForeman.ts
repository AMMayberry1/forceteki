import AbilityHelper from '../../../AbilityHelper';
import { LeaderUnitCard } from '../../../core/card/LeaderUnitCard';
import { StateWatcherRegistrar } from '../../../core/stateWatcher/StateWatcherRegistrar';
import { CardsLeftPlayThisPhaseWatcher } from '../../../stateWatchers/CardsLeftPlayThisPhaseWatcher';
import { GameSystem } from '../../../core/gameSystem/GameSystem';
import { TriggeredAbilityContext } from '../../../core/ability/TriggeredAbilityContext';
import { WildcardCardType } from '../../../core/Constants';

export default class WatTamborTechnoUnionForeman extends LeaderUnitCard {
    private cardsLeftPlayThisPhaseWatcher: CardsLeftPlayThisPhaseWatcher;

    protected override getImplementationId() {
        return {
            id: '1686059165',
            internalName: 'wat-tambor#techno-union-foreman',
        };
    }

    protected override setupStateWatchers(registrar: StateWatcherRegistrar): void {
        this.cardsLeftPlayThisPhaseWatcher = AbilityHelper.stateWatchers.cardsLeftPlayThisPhase(registrar, this);
    }

    protected override setupLeaderSideAbilities() {
        this.addActionAbility({
            title: 'If a friendly unit was defeated this phase, give a unit +2/+2 for this phase',
            cost: AbilityHelper.costs.exhaustSelf(),
            targetResolver: {
                cardTypeFilter: WildcardCardType.Unit,
                immediateEffect: this.getWatTamborEffect()
            }
        });
    }

    protected override setupLeaderUnitSideAbilities() {
        this.addOnAttackAbility({
            title: 'If a friendly unit was defeated this phase, give a unit +2/+2 for this phase',
            optional: true,
            targetResolver: {
                cardTypeFilter: WildcardCardType.Unit,
                cardCondition: (card, context) => card !== context.source,
                immediateEffect: this.getWatTamborEffect(),
            }
        });
    }

    private getWatTamborEffect(): GameSystem<TriggeredAbilityContext<this>> {
        return AbilityHelper.immediateEffects.conditional({
            condition: (context) => {
                const friendlyUnitsLeftPlayThisPhase = this.cardsLeftPlayThisPhaseWatcher.getCardsLeftPlayControlledByPlayer({ controller: context.source.controller, filter: (entry) => entry.card.isUnit() });
                return friendlyUnitsLeftPlayThisPhase.length > 0;
            },
            onTrue: AbilityHelper.immediateEffects.forThisPhaseCardEffect({
                effect: AbilityHelper.ongoingEffects.modifyStats({ power: 2, hp: 2 })
            }),
            onFalse: AbilityHelper.immediateEffects.noAction()
        });
    }
}

WatTamborTechnoUnionForeman.implemented = true;
