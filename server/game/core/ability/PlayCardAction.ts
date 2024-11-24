import * as CostLibrary from '../../costs/CostLibrary';
import { resourceCard } from '../../gameSystems/GameSystemLibrary';
import { IActionTargetResolver } from '../../TargetInterfaces';
import { Card } from '../card/Card';
import { EffectName, KeywordName, PhaseName, PlayType, Stage } from '../Constants';
import { ICost } from '../cost/ICost';
import { AbilityContext } from './AbilityContext';
import PlayerAction from './PlayerAction';
import { TriggerHandlingMode } from '../event/EventWindow.js';
import { CostAdjuster } from '../cost/CostAdjuster';

export interface IPlayCardActionProperties {
    card: Card;
    title?: string;
    playType?: PlayType;
    triggerHandlingMode?: TriggerHandlingMode;
    costAdjuster?: CostAdjuster;
    targetResolver?: IActionTargetResolver;
    additionalCosts?: ICost[];
}

export type PlayCardContext = AbilityContext & { onPlayCardSource: any };

export abstract class PlayCardAction extends PlayerAction {
    protected readonly playType: PlayType;
    public readonly costAdjuster: CostAdjuster;

    public constructor(properties: IPlayCardActionProperties) {
        const propertiesWithDefaults = { title: 'Play this card', playType: PlayType.PlayFromHand, triggerHandlingMode: TriggerHandlingMode.ResolvesTriggers, additionalCosts: [], ...properties };
        super(
            propertiesWithDefaults.card,
            PlayCardAction.getTitle(propertiesWithDefaults.title, propertiesWithDefaults.playType),
            propertiesWithDefaults.additionalCosts.concat(CostLibrary.payPlayCardResourceCost(propertiesWithDefaults.playType)),
            propertiesWithDefaults.targetResolver,
            propertiesWithDefaults.triggerHandlingMode
        );

        this.playType = propertiesWithDefaults.playType;
        this.costAdjuster = propertiesWithDefaults.costAdjuster;
    }

    private static getTitle(title: string, playType: PlayType): string {
        switch (playType) {
            case PlayType.Smuggle:
                return title + ' with Smuggle';
            default:
                return title;
        }
    }

    public override meetsRequirements(context = this.createContext(), ignoredRequirements: string[] = []): string {
        if (
            !ignoredRequirements.includes('phase') &&
            context.game.currentPhase !== PhaseName.Action
        ) {
            return 'phase';
        }
        if (
            !ignoredRequirements.includes('zone') &&
            !context.player.isCardInPlayableZone(context.source, this.playType)
        ) {
            return 'zone';
        }
        if (
            !ignoredRequirements.includes('cannotTrigger') &&
            !context.source.canPlay(context, this.playType)
        ) {
            return 'cannotTrigger';
        }
        if (PlayType.Smuggle === this.playType && !context.source.hasSomeKeyword(KeywordName.Smuggle)) {
            return 'smuggleKeyword';
        }
        return super.meetsRequirements(context, ignoredRequirements);
    }

    public override createContext(player = this.card.controller) {
        return new AbilityContext({
            ability: this,
            game: this.card.game,
            player: player,
            source: this.card,
            stage: Stage.PreTarget,
            costAspects: this.card.aspects
        });
    }

    public override isCardPlayed(): this is PlayCardAction {
        return true;
    }

    public override getAdjustedCost(context) {
        const resourceCost = this.cost.find((cost) => cost.getAdjustedCost);
        return resourceCost ? resourceCost.getAdjustedCost(context) : 0;
    }

    public override getCosts(context) {
        const costs = super.getCosts(context);
        if (context.player.hasOngoingEffect(EffectName.AdditionalPlayCost)) {
            const additionalPlayCosts = context.player
                .getOngoingEffectValues(EffectName.AdditionalPlayCost)
                .map((effect) => effect(context))
                // filter out any undefined or null cost
                .filter((cost) => cost);
            return costs.concat(additionalPlayCosts);
        }
        return costs;
    }

    public generateSmuggleEvent(context: PlayCardContext) {
        return resourceCard({ target: context.player.getTopCardOfDeck() }).generateEvent(context);
    }
}
