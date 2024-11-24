const { GameObject } = require('./GameObject');
const { Deck } = require('../Deck.js');
const UpgradePrompt = require('./gameSteps/prompts/UpgradePrompt.js');
const { clockFor } = require('./clocks/ClockSelector.js');
const { CostAdjuster, CostAdjustType } = require('./cost/CostAdjuster');
const { PlayableZone } = require('./PlayableZone');
const { PlayerPromptState } = require('./PlayerPromptState.js');
const Contract = require('./utils/Contract');
const {
    CardType,
    EffectName,
    EventName,
    ZoneName,
    RelativePlayer,
    Aspect,
    WildcardZoneName,
    PlayType,
    KeywordName,
    WildcardCardType,
    Trait,
    WildcardRelativePlayer
} = require('./Constants');

const EnumHelpers = require('./utils/EnumHelpers');
const Helpers = require('./utils/Helpers');
const { InPlayCard } = require('./card/baseClasses/InPlayCard');
const { AbilityContext } = require('./ability/AbilityContext');
const { HandZone } = require('./zone/HandZone');
const { DeckZone } = require('./zone/DeckZone');
const { ResourceZone } = require('./zone/ResourceZone');
const { DiscardZone } = require('./zone/DiscardZone');
const { OutsideTheGameZone } = require('./zone/OutsideTheGameZone');
const { BaseZone } = require('./zone/BaseZone');
const { SpaceArenaZone } = require('./zone/SpaceArenaZone');
const { GroundArenaZone } = require('./zone/GroundArenaZone');

class Player extends GameObject {
    constructor(id, user, owner, game, clockDetails) {
        super(game, user.username);

        Contract.assertNotNullLike(id);
        Contract.assertNotNullLike(user);
        Contract.assertNotNullLike(owner);
        Contract.assertNotNullLike(game);
        // clockDetails is optional

        this.user = user;
        this.emailHash = this.user.emailHash;
        this.id = id;
        this.owner = owner;
        this.printedType = 'player';
        this.socket = null;
        this.disconnected = false;
        this.left = false;
        this.lobbyId = null;

        this.handZone = new HandZone(this);
        this.resourceZone = new ResourceZone(this);
        this.discardZone = new DiscardZone(this);
        this.canTakeActionsThisPhase = null;

        // mainly used for staging tokens when they are created / removed
        this.outsideTheGameZone = new OutsideTheGameZone(this);

        this.baseZone = null;
        this.deckZone = null;

        this.damageToBase = null;

        this.clock = clockFor(this, clockDetails);

        this.limitedPlayed = 0;
        this.decklist = {};
        this.decklistNames = {};
        this.costAdjusters = [];
        this.abilityMaxByIdentifier = {}; // This records max limits for abilities
        this.promptedActionWindows = user.promptedActionWindows || {
            // these flags represent phase settings
            action: true,
            regroup: true
        };
        // this.timerSettings = user.settings.timerSettings || {};
        // this.timerSettings.windowTimer = user.settings.windowTimer;
        this.optionSettings = user.settings.optionSettings;
        this.resetTimerAtEndOfRound = false;

        // TODO: this should be a user setting at some point
        this.autoSingleTarget = true;

        this.promptState = new PlayerPromptState(this);
    }

    startClock() {
        this.clock.start();
        if (this.opponent) {
            this.opponent.clock.opponentStart();
        }
    }

    stopNonChessClocks() {
        if (this.clock.name !== 'Chess Clock') {
            this.stopClock();
        }
    }

    stopClock() {
        this.clock.stop();
    }

    resetClock() {
        this.clock.reset();
    }

    /**
     * @param {import('./zone/AllArenasZone').IAllArenasForPlayerCardFilterProperties} filter
     */
    getArenaCards(filter = {}) {
        return this.game.allArenas.getCards({ ...filter, controller: this });
    }

    /**
     * @param {import('./zone/AllArenasZone').IAllArenasForPlayerSpecificTypeCardFilterProperties} filter
     */
    getArenaUnits(filter = {}) {
        return this.game.allArenas.getUnitCards({ ...filter, controller: this });
    }

    // TODO: this will be refactored to merge with getArenaUnits
    /**
     * Get all units in designated play arena(s) controlled by this player
     * @param { WildcardZoneName.AnyArena | ZoneName.GroundArena | ZoneName.SpaceArena } arena Arena to select units from
     */
    getUnitsInPlay(arena = WildcardZoneName.AnyArena, cardCondition = (card) => true) {
        return this.getArenaUnits({ arena, condition: cardCondition });
    }

    /**
     * @param {import('./zone/AllArenasZone').IAllArenasForPlayerSpecificTypeCardFilterProperties} filter
     */
    getArenaUpgrades(filter = {}) {
        return this.game.allArenas.getUpgradeCards({ ...filter, controller: this });
    }

    /**
     * @param {import('./zone/AllArenasZone').IAllArenasForPlayerCardFilterProperties} filter
     */
    hasSomeArenaCard(filter) {
        return this.game.allArenas.hasSomeCard({ ...filter, controller: this });
    }

    /**
     * @param {import('./zone/AllArenasZone').IAllArenasForPlayerSpecificTypeCardFilterProperties} filter
     */
    hasSomeArenaUnit(filter) {
        return this.game.allArenas.hasSomeCard({ ...filter, type: WildcardCardType.Unit, controller: this });
    }

    /**
     * @param {import('./zone/AllArenasZone').IAllArenasForPlayerSpecificTypeCardFilterProperties} filter
     */
    hasSomeArenaUpgrade(filter) {
        return this.game.allArenas.hasSomeCard({ ...filter, type: WildcardCardType.Upgrade, controller: this });
    }

    /**
     * Get all units in designated play arena(s) controlled by this player
     * @param { Trait } trait Get units with this trait
     */
    getUnitsInPlayWithTrait(trait) {
        return this.getArenaUnits({ trait });
    }

    /**
     * Get all cards in designated play arena(s) other than the passed card controlled by this player.
     * @param { any } ignoreUnit Unit to filter from the returned results
     * @param { Trait } trait The Trait to check for
     * @param { WildcardZoneName.AnyArena | ZoneName.GroundArena | ZoneName.SpaceArena } arena Arena to select units from
     */
    getOtherUnitsInPlayWithTrait(ignoreUnit, trait, arena = WildcardZoneName.AnyArena) {
        return this.getArenaCards({ otherThan: ignoreUnit, trait, arena }).filter((card) => card.isUnit() && card !== ignoreUnit && card.hasSomeTrait(trait));
    }


    /**
     * Get all units in designated play arena(s) controlled by this player
     * @param { Aspect } aspect Aspect needed for units
     * @param { WildcardZoneName.AnyArena | ZoneName.GroundArena | ZoneName.SpaceArena } arena Arena to select units from
     */
    getUnitsInPlayWithAspect(aspect, arena = WildcardZoneName.AnyArena, cardCondition = (card) => true) {
        return this.getArenaUnits({ aspect, arena, condition: cardCondition });
    }

    /**
     * Get all cards in designated play arena(s) other than the passed card controlled by this player.
     * @param { any } ignoreUnit Unit to filter from the returned results
     * @param { WildcardZoneName.AnyArena | ZoneName.GroundArena | ZoneName.SpaceArena } arena Arena to select units from
     */
    getOtherUnitsInPlay(ignoreUnit, arena = WildcardZoneName.AnyArena, cardCondition = (card) => true) {
        return this.getArenaUnits({ otherThan: ignoreUnit, arena, condition: cardCondition });
    }

    /**
     * Get all cards in designated play arena(s) other than the passed card controlled by this player.
     * @param { any } ignoreUnit Unit to filter from the returned results
     * @param { Aspect } aspect Aspect needed for units
     * @param { WildcardZoneName.AnyArena | ZoneName.GroundArena | ZoneName.SpaceArena } arena Arena to select units from
     */
    getOtherUnitsInPlayWithAspect(ignoreUnit, aspect, arena = WildcardZoneName.AnyArena, cardCondition = (card) => true) {
        return this.getArenaUnits({ otherThan: ignoreUnit, aspect, arena, condition: cardCondition });
    }

    /**
     * @param { String } title the title of the unit or leader to check for control of
     * @returns { boolean } true if this player controls a unit or leader with the given title
     */
    controlsLeaderOrUnitWithTitle(title) {
        return this.leader.title === title || this.hasSomeArenaUnit({ condition: (card) => card.title === title });
    }

    getCardsInZone(zoneName) {
        switch (zoneName) {
            case ZoneName.Hand:
                return this.handZone.cards;
            case ZoneName.Deck:
                return this.deckZone.cards;
            case ZoneName.Discard:
                return this.discardZone.cards;
            case ZoneName.Resource:
                return this.resourceZone.cards;
            case ZoneName.Base:
                return this.baseZone.cards;
            case ZoneName.OutsideTheGame:
                return this.outsideTheGameZone.cards;
            case ZoneName.SpaceArena:
                return this.game.spaceArena.getCards({ controller: this });
            case ZoneName.GroundArena:
                return this.game.groundArena.getCards({ controller: this });
            default:
                Contract.fail(`Unknown zone: ${zoneName}`);
        }
    }

    /**
     * Checks whether a card with a uuid matching the passed card is in the passed _(Array)
     * @param list _(Array)
     * @param card BaseCard
     */
    isCardUuidInList(list, card) {
        return list.any((c) => {
            return c.uuid === card.uuid;
        });
    }

    /**
     * Checks whether a card with a name matching the passed card is in the passed list
     * @param list _(Array)
     * @param card BaseCard
     */
    isCardNameInList(list, card) {
        return list.any((c) => {
            return c.name === card.name;
        });
    }

    /**
     * Removes a card with the passed uuid from a list. Returns an _(Array)
     * @param list _(Array)
     * @param {String} uuid
     */
    removeCardByUuid(list, uuid) {
        return list.filter((card) => card.uuid !== uuid);
    }

    /**
     * Returns a card with the passed name in the passed list
     * @param list _(Array)
     * @param {String} name
     */
    findCardByName(list, name) {
        return this.findCard(list, (card) => card.name === name);
    }

    /**
     * Returns a list of cards matching passed name
     * @param list _(Array)
     * @param {String} name
     */
    findCardsByName(list, name) {
        return this.findCards(list, (card) => card.name === name);
    }

    /**
     * Returns a card with the passed uuid in the passed list
     * @param list _(Array)
     * @param {String} uuid
     */
    findCardByUuid(list, uuid) {
        return this.findCard(list, (card) => card.uuid === uuid);
    }

    /**
     * Returns a card with the passed uuid from cardsInPlay
     * @param {String} uuid
     */
    findCardInPlayByUuid(uuid) {
        return this.findCard(this.getArenaCards(), (card) => card.uuid === uuid);
    }

    /**
     * Returns a card which matches passed predicate in the passed list
     * @param cardList _(Array)
     * @param {Function} predicate - BaseCard => Boolean
     */
    findCard(cardList, predicate) {
        var cards = this.findCards(cardList, predicate);
        if (!cards || cards.length === 0) {
            return undefined;
        }

        return cards[0];
    }

    /**
     * Returns an Array of BaseCard which match passed predicate in the passed list
     * @param cardList _(Array)
     * @param {Function} predicate - BaseCard => Boolean
     */
    findCards(cardList, predicate) {
        Contract.assertNotNullLike(cardList);

        var cardsToReturn = [];

        cardList.forEach((card) => {
            if (predicate(card)) {
                cardsToReturn.push(card);
            }

            return cardsToReturn;
        });

        return cardsToReturn;
    }

    // TODO: add support for checking upgrades
    /**
     * Returns if a unit is in play that has the passed trait
     * @param {Trait} trait
     * @param {any} ignoreUnit
     * @returns {boolean} true/false if the trait is in play
     */
    isTraitInPlay(trait, ignoreUnit = null) {
        return this.hasSomeArenaUnit({ trait, otherThan: ignoreUnit });
    }

    /**
     * Returns if a unit is in play that has the passed aspect
     * @param {Aspect} aspect
     * @param {any} ignoreUnit
     * @returns {boolean} true/false if the trait is in play
     */
    isAspectInPlay(aspect, ignoreUnit = null) {
        return this.hasSomeArenaUnit({ aspect, otherThan: ignoreUnit });
    }

    /**
     * Returns if a unit is in play that has the passed keyword
     * @param {KeywordName} keyword
     * @param {any} ignoreUnit
     * @returns {boolean} true/false if the trait is in play
     */
    isKeywordInPlay(keyword, ignoreUnit = null) {
        return this.hasSomeArenaUnit({ keyword, otherThan: ignoreUnit });
    }

    /**
     * Returns true if any units or upgrades controlled by this player match the passed predicate
     * @param {Function} predicate - DrawCard => Boolean
     */
    anyCardsInPlay(predicate) {
        return this.game.allCards.some(
            (card) => card.controller === this && EnumHelpers.isArena(card.zoneName) && predicate(card)
        );
    }

    /**
     * Returns an Array of all unots and upgrades matching the predicate controlled by this player
     * @param {Function} predicate  - DrawCard => Boolean
     */
    filterCardsInPlay(predicate) {
        return this.game.allCards.filter(
            (card) => card.controller === this && EnumHelpers.isArena(card.zoneName) && predicate(card)
        );
    }

    isActivePlayer() {
        return this.game.actionPhaseActivePlayer === this;
    }

    hasInitiative() {
        return this.game.initiativePlayer === this;
    }

    /**
     * Returns the total number of units and upgrades controlled by this player which match the passed predicate
     * @param {Function} predicate - DrawCard => Int
     */
    getNumberOfCardsInPlay(predicate) {
        return this.game.allCards.reduce((num, card) => {
            if (card.controller === this && EnumHelpers.isArena(card.zoneName) && predicate(card)) {
                return num + 1;
            }

            return num;
        }, 0);
    }

    /**
     * Checks whether the passed card is in a legal zone for the passed type of play
     * @param card BaseCard
     * @param {String} playingType
     */
    isCardInPlayableZone(card, playingType = null) {
        // use an effect check to see if this card is in an out of play zone but can still be played from
        if (card.getOngoingEffectValues(EffectName.CanPlayFromOutOfPlay).filter((a) => a.player(this, card)).length > 0) {
            return true;
        }

        return this.playableZones.some(
            (zone) => (!playingType || zone.playingType === playingType) && zone.includes(card)
        );
    }

    findPlayType(card) {
        if (card.getOngoingEffectValues(EffectName.CanPlayFromOutOfPlay).filter((a) => a.player(this, card)).length > 0) {
            let effects = card.getOngoingEffectValues(EffectName.CanPlayFromOutOfPlay).filter((a) => a.player(this, card));
            return effects[effects.length - 1].playType || PlayType.PlayFromHand;
        }

        let zone = this.playableZones.find((zone) => zone.includes(card));
        if (zone) {
            return zone.playingType;
        }

        return undefined;
    }

    /**
     * Returns a card in play under this player's control which matches (for uniqueness) the passed card
     * @param {InPlayCard} card
     * @returns {InPlayCard[]} Duplicates of passed card (does not check unique status)
     */
    getDuplicatesInPlay(card) {
        return this.getArenaCards().filter((otherCard) =>
            otherCard.title === card.title &&
            otherCard.subtitle === card.subtitle &&
            otherCard !== card
        );
    }

    /**
     * Returns ths top card of the player's deck
     * @returns {import('./card/CardTypes').TokenOrPlayableCard | null} the Card,© or null if the deck is empty
     */
    getTopCardOfDeck() {
        if (this.drawDeck.length > 0) {
            return this.drawDeck[0];
        }
        return null;
    }


    /**
     * Returns ths top cards of the player's deck
     * @returns {import('./card/CardTypes').TokenOrPlayableCard[]} the Card,© or null if the deck is empty
     */
    getTopCardsOfDeck(numCard) {
        Contract.assertPositiveNonZero(numCard);
        const deckLength = this.drawDeck.length;
        const cardsToGet = Math.min(numCard, deckLength);

        if (this.drawDeck.length > 0) {
            return this.drawDeck.slice(0, cardsToGet);
        }
        return [];
    }

    /**
     * Draws the passed number of cards from the top of the deck into this players hand, shuffling if necessary
     * @param {number} numCards
     */
    drawCardsToHand(numCards) {
        if (numCards > this.drawDeck.length) {
            // TODO: move log message into the DrawSystem
            // Game log message about empty deck damage(the damage itself is handled in DrawSystem.updateEvent()).
            this.game.addMessage('{0} attempts to draw {1} cards from their empty deck and takes {2} damage instead ',
                this.name, numCards - this.drawDeck.length, 3 * (numCards - this.drawDeck.length)
            );
        }
        for (let card of this.drawDeck.slice(0, numCards)) {
            card.moveTo(ZoneName.Hand);
        }
    }

    // /**
    //  * Called when one of the players decks runs out of cards, removing 5 honor and shuffling the discard pile back into the deck
    //  * @param {String} deck - one of 'conflict' or 'dynasty'
    //  */
    // deckRanOutOfCards(deck) {
    //     let discardPile = this.getCardPile(deck + ' discard pile');
    //     let action = GameSystems.loseHonor({ amount: this.game.gameMode === GameMode.Skirmish ? 3 : 5 });
    //     if (action.canAffect(this, this.game.getFrameworkContext())) {
    //         this.game.addMessage(
    //             '{0}'s {1} deck has run out of cards, so they lose {2} honor',
    //             this,
    //             deck,
    //             this.game.gameMode === GameMode.Skirmish ? 3 : 5
    //         );
    //     } else {
    //         this.game.addMessage('{0}'s {1} deck has run out of cards', this, deck);
    //     }
    //     action.resolve(this, this.game.getFrameworkContext());
    //     this.game.queueSimpleStep(() => {
    //         discardPile.each((card) => this.moveCard(card, deck + ' deck'));
    //         if (deck === 'dynasty') {
    //             this.shuffleDynastyDeck();
    //         } else {
    //             this.shuffleConflictDeck();
    //         }
    //     });
    // }

    // /**
    //  * Moves the top card of the dynasty deck to the passed province
    //  * @param {String} zone - one of 'province 1', 'province 2', 'province 3', 'province 4'
    //  */
    // replaceDynastyCard(zone) {
    //     let province = this.getProvinceCardInProvince(zone);

    //     if (!province || this.getCardPile(zone).size() > 1) {
    //         return false;
    //     }
    //     if (this.dynastyDeck.size() === 0) {
    //         this.deckRanOutOfCards('dynasty');
    //         this.game.queueSimpleStep(() => this.replaceDynastyCard(zone));
    //     } else {
    //         let refillAmount = 1;
    //         if (province) {
    //             let amount = province.mostRecentOngoingEffect(EffectName.RefillProvinceTo);
    //             if (amount) {
    //                 refillAmount = amount;
    //             }
    //         }

    //         this.refillProvince(zone, refillAmount);
    //     }
    //     return true;
    // }

    // putTopDynastyCardInProvince(zone, facedown = false) {
    //     if (this.dynastyDeck.size() === 0) {
    //         this.deckRanOutOfCards('dynasty');
    //         this.game.queueSimpleStep(() => this.putTopDynastyCardInProvince(zone, facedown));
    //     } else {
    //         let cardFromDeck = this.dynastyDeck.first();
    //         this.moveCard(cardFromDeck, zone);
    //         cardFromDeck.facedown = facedown;
    //         return true;
    //     }
    //     return true;
    // }

    /**
     * Shuffles the deck, displaying a message in chat
     * @param {AbilityContext} context
     */
    shuffleDeck(context = null) {
        this.game.addMessage('{0} is shuffling their deck', this);
        this.deckZone.shuffle();
    }

    /**
     * Takes a decklist passed from the lobby, creates all the cards in it, and puts references to them in the relevant lists
     */
    prepareDecks() {
        var preparedDecklist = new Deck(this.decklistNames).prepare(this);

        this.base = preparedDecklist.base;
        this.leader = preparedDecklist.leader;

        this.deckZone = new DeckZone(this, preparedDecklist.deckCards);

        // set up playable zones now that all relevant zones are created
        this.playableZones = [
            new PlayableZone(PlayType.PlayFromHand, this.handZone),
            new PlayableZone(PlayType.Smuggle, this.resourceZone),
            new PlayableZone(PlayType.PlayFromOutOfPlay, this.deckZone),
            new PlayableZone(PlayType.PlayFromOutOfPlay, this.discardZone),
        ];

        this.baseZone = new BaseZone(this, this.base, this.leader);

        this.decklist = preparedDecklist;
    }

    /**
     * Called when the Game object starts the game. Creates all cards on this players decklist, shuffles the decks and initialises player parameters for the start of the game
     */
    initialise() {
        this.opponent = this.game.getOtherPlayer(this);

        this.prepareDecks();
        // shuffling happens during game setup

        this.maxLimited = 1;
    }

    /**
     * Adds the passed Cost Adjuster to this Player
     * @param source = OngoingEffectSource source of the adjuster
     * @param {Object} properties
     * @returns {CostAdjuster}
     */
    addCostAdjuster(source, properties) {
        let adjuster = new CostAdjuster(this.game, source, properties);
        this.costAdjusters.push(adjuster);
        return adjuster;
    }

    /**
     * Unregisters and removes the passed Cost Adjusters from this Player
     * @param {CostAdjuster} adjuster
     */
    removeCostAdjuster(adjuster) {
        if (this.costAdjusters.includes(adjuster)) {
            adjuster.unregisterEvents();
            this.costAdjusters = this.costAdjusters.filter((r) => r !== adjuster);
        }
    }

    addPlayableZone(type, zone) {
        let playableZone = new PlayableZone(type, zone);
        this.playableZones.push(playableZone);
        return playableZone;
    }

    removePlayableZone(zone) {
        this.playableZones = this.playableZones.filter((l) => l !== zone);
    }

    /**
     * Returns the aspects for this player (derived from base and leader)
     */
    getAspects() {
        return this.leader.aspects.concat(this.base.aspects);
    }

    getPenaltyAspects(costAspects) {
        if (!costAspects) {
            return [];
        }

        let playerAspects = this.getAspects();

        let penaltyAspects = [];
        for (const aspect of costAspects) {
            let matchedIndex = playerAspects.indexOf(aspect);
            if (matchedIndex === -1) {
                penaltyAspects.push(aspect);
            } else {
                playerAspects.splice(matchedIndex, 1);
            }
        }

        return penaltyAspects;
    }

    /**
     * Checks to see what the minimum possible resource cost for an action is, accounting for aspects and available cost adjusters
     * @param {PlayType} playingType
     * @param {AbilityContext} context
     * @param target
     * @param {CostAdjuster} additionalCostAdjuster Used by abilities to add their own specific cost adjuster if necessary
     */
    getMinimumPossibleCost(playingType, context, target, additionalCostAdjuster = null) {
        const card = context.source;
        const adjustedCost = this.getAdjustedCost(playingType, card, target, additionalCostAdjuster);

        return Math.max(adjustedCost, 0);
    }

    /**
     * Checks if any Cost Adjusters on this Player apply to the passed card/target, and returns the cost to play the cost if they are used.
     * Accounts for aspect penalties and any modifiers to those specifically
     * @param {PlayType} playingType
     * @param card
     * @param target
     * @param {CostAdjuster} additionalCostAdjuster Used by abilities to add their own specific cost adjuster if necessary
     */
    getAdjustedCost(playingType, card, target, additionalCostAdjuster = null) {
        // if any aspect penalties, check modifiers for them separately
        let aspectPenaltiesTotal = 0;
        let aspects;
        let cost;

        switch (playingType) {
            case PlayType.PlayFromOutOfPlay:
            case PlayType.PlayFromHand:
                aspects = card.aspects;
                cost = card.cost;
                break;
            case PlayType.Smuggle:
                const smuggleInstance = card.getKeywordWithCostValues(KeywordName.Smuggle);
                aspects = smuggleInstance.aspects;
                cost = smuggleInstance.cost;
                break;
            default:
                Contract.fail(`Invalid Play Type ${playingType}`);
        }

        let penaltyAspects = this.getPenaltyAspects(aspects);
        for (const aspect of penaltyAspects) {
            aspectPenaltiesTotal += this.runAdjustersForAspectPenalties(playingType, 2, card, target, aspect, additionalCostAdjuster);
        }

        let penalizedCost = cost + aspectPenaltiesTotal;
        return this.runAdjustersForCostType(playingType, penalizedCost, card, target, additionalCostAdjuster);
    }

    /**
     * Runs the Adjusters for a specific cost type - either base cost or an aspect penalty - and returns the modified result
     * @param {PlayType} playingType
     * @param {number} baseCost
     * @param card
     * @param target
     * @param {CostAdjuster} additionalCostAdjuster Used by abilities to add their own specific cost adjuster if necessary
     */
    runAdjustersForCostType(playingType, baseCost, card, target, additionalCostAdjuster = null) {
        var matchingAdjusters = this.costAdjusters.concat(additionalCostAdjuster).filter((adjuster) =>
            adjuster?.canAdjust(playingType, card, target, null)
        );
        var costIncreases = matchingAdjusters
            .filter((adjuster) => adjuster.costAdjustType === CostAdjustType.Increase)
            .reduce((cost, adjuster) => cost + adjuster.getAmount(card, this), 0);
        var costDecreases = matchingAdjusters
            .filter((adjuster) => adjuster.costAdjustType === CostAdjustType.Decrease)
            .reduce((cost, adjuster) => cost + adjuster.getAmount(card, this), 0);

        baseCost += costIncreases;
        var reducedCost = baseCost - costDecreases;

        if (matchingAdjusters.some((adjuster) => adjuster.costAdjustType === CostAdjustType.Free)) {
            reducedCost = 0;
        }

        return Math.max(reducedCost, 0);
    }


    /**
     * Runs the Adjusters for a specific cost type - either base cost or an aspect penalty - and returns the modified result
     * @param {PlayType} playingType
     * @param {number} baseCost
     * @param card
     * @param target
     * @param penaltyAspect Aspect that is not present on the current base or leader
     * @param {CostAdjuster} additionalCostAdjuster Used by abilities to add their own specific cost adjuster if necessary
     */
    runAdjustersForAspectPenalties(playingType, baseCost, card, target, penaltyAspect, additionalCostAdjuster = null) {
        var matchingAdjusters = this.costAdjusters.concat(additionalCostAdjuster).filter((adjuster) =>
            adjuster?.canAdjust(playingType, card, target, penaltyAspect)
        );

        var ignoreAllAspectPenalties = matchingAdjusters
            .filter((adjuster) => adjuster.costAdjustType === CostAdjustType.IgnoreAllAspects).length > 0;

        var ignoreSpecificAspectPenalty = matchingAdjusters
            .filter((adjuster) => adjuster.costAdjustType === CostAdjustType.IgnoreSpecificAspects).length > 0;

        var cost = baseCost;
        if (ignoreAllAspectPenalties || ignoreSpecificAspectPenalty) {
            cost -= 2;
        }

        return Math.max(cost, 0);
    }

    /**
     * Mark all cost adjusters which are valid for this card/target/playingType as used, and remove them if they have no uses remaining
     * @param {String} playingType
     * @param card DrawCard
     * @param target BaseCard
     */
    markUsedAdjusters(playingType, card, target = null, aspects = null) {
        var matchingAdjusters = this.costAdjusters.filter((adjuster) => adjuster.canAdjust(playingType, card, target, null, aspects));
        matchingAdjusters.forEach((adjuster) => {
            adjuster.markUsed();
            if (adjuster.isExpired()) {
                this.removeCostAdjuster(adjuster);
            }
        });
    }

    /**
     * Called at the start of the Action Phase.  Resets some of the single round parameters
     */
    resetForActionPhase() {
        if (this.resetTimerAtEndOfRound) {
            this.noTimer = false;
        }
        this.passedActionPhase = false;
    }

    /**
     * Called at the end of the Action Phase.  Resets some of the single round parameters
     */
    cleanupFromActionPhase() {
        this.passedActionPhase = null;
    }

    // showDeck() {
    //     this.showDeck = true;
    // }

    // /**
    //  * Called when a player drags and drops a card from one zone on the client to another
    //  * @param {String} cardId - the uuid of the dropped card
    //  * @param source
    //  * @param target
    //  */
    // drop(cardId, source, target) {
    //     var sourceList = this.getCardPile(source);
    //     var card = this.findCardByUuid(sourceList, cardId);

    //     // Dragging is only legal in manual mode, when the card is currently in source, when the source and target are different and when the target is a legal zone
    //     if (
    //         !this.game.manualMode ||
    //         source === target ||
    //         !this.isLegalZoneForCardTypes(card.types, target) ||
    //         card.zoneName !== source
    //     ) {
    //         return;
    //     }

    //     // Don't allow two province cards in one province
    //     if (
    //         card.isProvince &&
    //         target !== ZoneName.ProvinceDeck &&
    //         this.getCardPile(target).any((card) => card.isProvince)
    //     ) {
    //         return;
    //     }

    //     let display = 'a card';
    //     if (
    //         (card.isFaceup() && source !== ZoneName.Hand) ||
    //         [
    //             ZoneName.PlayArea,
    //             ZoneName.DynastyDiscardPile,
    //             ZoneName.ConflictDiscardPile,
    //             ZoneName.RemovedFromGame
    //         ].includes(target)
    //     ) {
    //         display = card;
    //     }

    //     this.game.addMessage('{0} manually moves {1} from their {2} to their {3}', this, display, source, target);
    //     this.moveCard(card, target);
    //     this.game.resolveGameState(true);
    // }

    /**
     * Checks whether card type is consistent with zone, checking for custom out-of-play zones
     * @param {CardType} cardType
     * @param {ZoneName | import('./Constants').MoveZoneDestination} zone
     */
    isLegalZoneForCardType(cardType, zone) {
        const legalZonesForType = Helpers.defaultLegalZonesForCardTypeFilter(cardType);

        return legalZonesForType && EnumHelpers.cardZoneMatches(EnumHelpers.asConcreteZone(zone), legalZonesForType);
    }

    /**
     * This is only used when an upgrade is dragged into play.  Usually,
     * upgrades are played by playCard()
     * @deprecated
     */
    promptForUpgrade(card, playingType) {
        this.game.queueStep(new UpgradePrompt(this.game, this, card, playingType));
    }

    // get skillModifier() {
    //     return this.getOngoingEffectValues(EffectName.ChangePlayerSkillModifier).reduce((total, value) => total + value, 0);
    // }

    /**
     * Called by the game when the game starts, sets the players decklist
     * @param {*} deck
     */
    selectDeck(deck) {
        this.decklistNames = deck;
        this.decklistNames.selected = true;
    }

    // TODO NOISY PR: rearrange this file into sections
    get hand() {
        return this.handZone.cards;
    }

    get discard() {
        return this.discardZone.cards;
    }

    get resources() {
        return this.resourceZone.cards;
    }

    get drawDeck() {
        return this.deckZone.cards;
    }

    /**
     * Returns the number of resources available to spend
     */
    get readyResourceCount() {
        return this.resourceZone.readyResourceCount;
    }

    /**
     * Returns the number of exhausted resources
     */
    get exhaustedResourceCount() {
        return this.resourceZone.exhaustedResourceCount;
    }

    /**
     * Moves a card from its current zone to the resource zone
     * @param card BaseCard
     * @param {boolean} exhaust Whether to exhaust the card. True by default.
     */
    resourceCard(card, exhaust = true) {
        card.moveTo(ZoneName.Resource);
        card.exhausted = exhaust;
    }

    /**
     * Exhaust the specified number of resources
     */
    // TODO: Create an ExhaustResourcesSystem
    exhaustResources(count, priorityResources = []) {
        const readyPriorityResources = priorityResources.filter((resource) => !resource.exhausted);
        const regularResourcesToReady = count - this.exhaustResourcesInList(readyPriorityResources, count);

        if (regularResourcesToReady > 0) {
            const readyRegularResources = this.resourceZone.readyResources;
            this.exhaustResourcesInList(readyRegularResources, regularResourcesToReady);
        }
    }

    /**
     * Returns how many resources were readied
     */
    exhaustResourcesInList(resources, count) {
        if (count < resources.length) {
            resources.slice(0, count).forEach((resource) => resource.exhaust());
            return count;
        }

        resources.forEach((resource) => resource.exhaust());
        return resources.length;
    }

    /**
     * Ready the specified number of resources
     */
    readyResources(count) {
        let exhaustedResources = this.resourceZone.exhaustedResources;
        for (let i = 0; i < Math.min(count, exhaustedResources.length); i++) {
            exhaustedResources[i].exhausted = false;
        }
    }

    /**
     *
     * If possible, exhaust the given resource and ready another one instead
     */
    swapResourceReadyState(resource) {
        Contract.assertTrue(resource.zoneName === ZoneName.Resource, 'Tried to exhaust a resource that is not in the resource zone');

        // The resource is already exhausted, do nothing
        if (resource.exhausted) {
            return;
        }

        // Find an exhausted resource to ready and swap the status
        let exhaustedResource = this.resources.find((card) => card.exhausted);
        if (exhaustedResource) {
            resource.exhaust();
            exhaustedResource.ready();
        }
    }

    /**
     * Sets the passed cards as selected
     * @param cards BaseCard[]
     */
    setSelectedCards(cards) {
        this.promptState.setSelectedCards(cards);
    }

    clearSelectedCards() {
        this.promptState.clearSelectedCards();
    }

    setSelectableCards(cards) {
        this.promptState.setSelectableCards(cards);
    }

    clearSelectableCards() {
        this.promptState.clearSelectableCards();
    }

    getSummaryForHand(list, activePlayer, hideWhenFaceup) {
        // if (this.optionSettings.sortHandByName) {
        //     return this.getSortedSummaryForCardList(list, activePlayer, hideWhenFaceup);
        // }
        return this.getSummaryForZone(list, activePlayer, hideWhenFaceup);
    }

    getSummaryForZone(zone, activePlayer, hideWhenFaceup) {
        return this.getCardsInZone(zone).map((card) => {
            return card.getSummary(activePlayer, hideWhenFaceup);
        });
    }

    getSortedSummaryForCardList(list, activePlayer, hideWhenFaceup) {
        let cards = list.map((card) => card);
        cards.sort((a, b) => a.printedName.localeCompare(b.printedName));

        return cards.map((card) => {
            return card.getSummary(activePlayer, hideWhenFaceup);
        });
    }

    getCardSelectionState(card) {
        return this.promptState.getCardSelectionState(card);
    }

    currentPrompt() {
        return this.promptState.getState();
    }

    setPrompt(prompt) {
        this.promptState.setPrompt(prompt);
    }

    cancelPrompt() {
        this.promptState.cancelPrompt();
    }

    isTopCardShown(activePlayer = undefined) {
        if (!activePlayer) {
            activePlayer = this;
        }

        if (activePlayer.drawDeck && activePlayer.drawDeck.size() <= 0) {
            return false;
        }

        if (activePlayer === this) {
            return (
                this.getOngoingEffectValues(EffectName.ShowTopCard).includes(WildcardRelativePlayer.Any) ||
                this.getOngoingEffectValues(EffectName.ShowTopCard).includes(RelativePlayer.Self)
            );
        }

        return (
            this.getOngoingEffectValues(EffectName.ShowTopCard).includes(WildcardRelativePlayer.Any) ||
            this.getOngoingEffectValues(EffectName.ShowTopCard).includes(RelativePlayer.Opponent)
        );
    }

    // eventsCannotBeCancelled() {
    //     return this.hasOngoingEffect(EffectName.EventsCannotBeCancelled);
    // }

    // // TODO STATE SAVE: what stats are we interested in?
    // getStats() {
    //     return {
    //         fate: this.fate,
    //         honor: this.getTotalHonor(),
    //         conflictsRemaining: this.getConflictOpportunities(),
    //         militaryRemaining: this.getRemainingConflictOpportunitiesForType(ConflictTypes.Military),
    //         politicalRemaining: this.getRemainingConflictOpportunitiesForType(ConflictTypes.Political)
    //     };
    // }

    // TODO STATE SAVE: clean this up
    // /**
    //  * This information is passed to the UI
    //  * @param {Player} activePlayer
    //  */
    getState(activePlayer) {
        let isActivePlayer = activePlayer === this;
        let promptState = isActivePlayer ? this.promptState.getState() : {};
        let { email, password, ...safeUser } = this.user;
        let state = {
            cardPiles: {
                hand: this.getSummaryForZone(ZoneName.Hand, activePlayer, false),
                outsideTheGame: this.getSummaryForZone(ZoneName.OutsideTheGame, activePlayer),
                resources: this.getSummaryForZone(ZoneName.Resource, activePlayer),
                groundArena: this.getSummaryForZone(ZoneName.GroundArena, activePlayer),
                spaceArena: this.getSummaryForZone(ZoneName.SpaceArena, activePlayer),
                deck: this.getSummaryForZone(ZoneName.Deck, activePlayer),
                discard: this.getSummaryForZone(ZoneName.Discard, activePlayer)
            },
            disconnected: this.disconnected,
            // faction: this.faction,
            hasInitiative: this.hasInitiative(),
            availableResources: this.readyResourceCount,
            leader: this.leader.getSummary(activePlayer),
            base: this.base.getSummary(activePlayer),
            id: this.id,
            left: this.left,
            name: this.name,
            // optionSettings: this.optionSettings,
            phase: this.game.currentPhase,
            promptedActionWindows: this.promptedActionWindows,
            // stats: this.getStats(),
            // timerSettings: this.timerSettings,
            user: safeUser
        };

        // if (this.showDeck) {
        //     state.showDeck = true;
        //     state.cardPiles.deck = this.getSummaryForZone(this.deck, activePlayer);
        // }

        // if (this.role) {
        //     state.role = this.role.getSummary(activePlayer);
        // }

        if (this.clock) {
            state.clock = this.clock.getState();
        }

        return { ...state, ...promptState };
    }
}

module.exports = Player;
