type CardWithDamageProperty = import('../../server/game/core/card/CardTypes').CardWithDamageProperty;
type BaseCard = import('../../server/game/core/card/BaseCard').BaseCard;
type LeaderCard = import('../../server/game/core/card/LeaderCard').LeaderCard;
type Game = import('../../server/game/core/Game');
type Player = import('../../server/game/core/Player');
type GameFlowWrapper = import('./GameFlowWrapper');
type PlayerInteractionWrapper = import('./PlayerInteractionWrapper');

declare let integration: (definitions: ((contextRef: SwuTestContextRef) => void) | (() => void)) => void;

interface SwuTestContextRef {
    context: SwuTestContext;
    setupTest: (options?: SwuSetupTestOptions) => void;
}

interface SwuTestContext {
    flow: GameFlowWrapper;
    game: Game;
    player1Object: Player;
    player2Object: Player;
    player1: PlayerInteractionWrapper;
    player2: PlayerInteractionWrapper;
    p1Base: BaseCard;
    p1Leader: LeaderCard;
    p2Base: BaseCard;
    p2Leader: LeaderCard;

    allPlayersInInitiativeOrder(): PlayerInteractionWrapper[];
    startGame();
    keepStartingHand();
    skipSetupPhase();
    selectInitiativePlayer(player: PlayerInteractionWrapper);
    moveToNextActionPhase();
    moveToRegroupPhase();
    advancePhases(endphase);
    getPromptedPlayer(title: string);
    nextPhase();
    getChatLogs(numbBack = 1, inOrder = false);
    getChatLog(numbBack = 0);
    setDamage(card: CardWithDamageProperty, amount: number);

    // To account for any dynamically added cards or objects, we have a free-form accessor.
    [field: string]: any;
}

interface SwuSetupTestOptions {
    phase?: string;
    player1?: SwuPlayerSetupOptions;
    player2?: SwuPlayerSetupOptions;

    [field: string]: any;
}

interface SwuPlayerSetupOptions {
    groundArena?: any[];
    spaceArena?: any[];
    hand?: any[];
    discard?: any[];
    leader?: any;
    base?: any;
    hasInitiative?: boolean;

    [field: string]: any;
}

declare namespace jasmine {
    export interface Matchers<T> {
        toHavePrompt<T extends PlayerInteractionWrapper>(this: Matchers<T>, expected: any): boolean;
        toHaveEnabledPromptButton<T extends PlayerInteractionWrapper>(this: Matchers<T>, expected: string): boolean;
        toHaveEnabledPromptButtons<T extends PlayerInteractionWrapper>(this: Matchers<T>, expecteds: string[]): boolean;
        toHaveDisabledPromptButton<T extends PlayerInteractionWrapper>(this: Matchers<T>, expected: string): boolean;
        toHaveDisabledPromptButtons<T extends PlayerInteractionWrapper>(this: Matchers<T>, expecteds: string[]): boolean;
        toHavePassAbilityButton<T extends PlayerInteractionWrapper>(this: Matchers<T>): boolean;
        toHavePassAttackButton<T extends PlayerInteractionWrapper>(this: Matchers<T>): boolean;
        toHaveChooseNoTargetButton<T extends PlayerInteractionWrapper>(this: Matchers<T>): boolean;
        toHaveClaimInitiativeAbilityButton<T extends PlayerInteractionWrapper>(this: Matchers<T>): boolean;
        toBeAbleToSelect<T extends PlayerInteractionWrapper>(this: Matchers<T>, card: any): boolean;
        toBeAbleToSelectAllOf<T extends PlayerInteractionWrapper>(this: Matchers<T>, cards: any[]): boolean;
        toBeAbleToSelectNoneOf<T extends PlayerInteractionWrapper>(this: Matchers<T>, cards: any[]): boolean;
        toBeAbleToSelectExactly<T extends PlayerInteractionWrapper>(this: Matchers<T>, cards: any[]): boolean;
        toHaveAvailableActionWhenClickedBy(player: PlayerInteractionWrapper): boolean;
        toBeActivePlayer<T extends PlayerInteractionWrapper>(this: Matchers<T>): boolean;
        toHaveInitiative<T extends PlayerInteractionWrapper>(this: Matchers<T>): boolean;
        toHavePassAbilityPrompt<T extends PlayerInteractionWrapper>(this: Matchers<T>, abilityText: any): boolean;
        toHavePassSingleTargetPrompt<T extends PlayerInteractionWrapper>(this: Matchers<T>, abilityText: any, target: any): boolean;
        toBeInBottomOfDeck(player: PlayerInteractionWrapper, numCards: number): boolean;
        toAllBeInBottomOfDeck(player: PlayerInteractionWrapper, numCards: number): boolean;
        toBeInZone(zone, player?: PlayerInteractionWrapper): boolean;
        toBeCapturedBy(card: any): boolean;
        toHaveExactUpgradeNames(upgradeNames: any[]): boolean;
        toHaveExactPromptButtons<T extends PlayerInteractionWrapper>(this: Matchers<T>, buttons: any[]): boolean;
        toHaveExactDropdownListOptions<T extends PlayerInteractionWrapper>(this: Matchers<T>, expectedOptions: any[]): boolean;
    }
}