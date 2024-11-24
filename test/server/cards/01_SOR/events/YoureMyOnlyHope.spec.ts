describe('You\'re My Only Hope', function() {
    integration(function(contextRef) {
        describe('You\'re My Only Hope\'s ability', function() {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        leader: 'hera-syndulla#spectre-two',
                        base: { card: 'administrators-tower', damage: 21 },
                        hand: ['youre-my-only-hope'],
                        deck: ['atst', 'wampa'],
                        groundArena: ['isb-agent']
                    },
                    player2: {
                        spaceArena: ['black-one#scourge-of-starkiller-base']
                    }
                });
            });

            it('shows the top card of the deck and allow to play it', function () {
                const { context } = contextRef;
                const reset = () => {
                    context.player1.moveCard(context.youreMyOnlyHope, 'hand');
                    context.player2.passAction();
                };

                // Scenario 1: Do nothing
                context.player1.clickCard(context.youreMyOnlyHope);
                // TODO: we need a 'look at' prompt for secretly revealing, currently chat logs go to all players
                expect(context.getChatLogs(1)).toContain('You\'re My Only Hope sees AT-ST');
                expect(context.player1).toHavePassAbilityPrompt('Play AT-ST, it costs 5 less');

                context.player1.passAction();
                expect(context.atst).toBeInZone('deck', context.player1);

                reset();

                // Scenario 2: Play the card for 5 less
                context.player1.clickCard(context.youreMyOnlyHope);
                // TODO: we need a 'look at' prompt for secretly revealing, currently chat logs go to all players
                expect(context.getChatLogs(1)).toContain('You\'re My Only Hope sees AT-ST');
                expect(context.player1).toHavePassAbilityPrompt('Play AT-ST, it costs 5 less');

                let exhaustedResourcesBeforeAction = context.player1.exhaustedResourceCount;
                context.player1.clickPrompt('Play AT-ST, it costs 5 less');
                expect(context.player1.exhaustedResourceCount).toBe(exhaustedResourcesBeforeAction + 3);
                expect(context.atst).toBeInZone('groundArena', context.player1);

                reset();

                // Scenario 3: Play the card for free
                context.player1.clickCard(context.isbAgent);
                context.player2.clickCard(context.blackOne);
                context.player1.clickCard(context.youreMyOnlyHope);
                expect(context.getChatLogs(1)).toContain('You\'re My Only Hope sees Wampa');
                expect(context.player1).toHavePassAbilityPrompt('Play Wampa for free');

                exhaustedResourcesBeforeAction = context.player1.exhaustedResourceCount;
                context.player1.clickPrompt('Play Wampa for free');
                expect(context.player1.exhaustedResourceCount).toBe(exhaustedResourcesBeforeAction);
                expect(context.wampa).toBeInZone('groundArena', context.player1);

                reset();

                // Scenario 4: Does not trigger if the deck is empty
                expect(context.player1.deck.length).toEqual(0);
                context.player1.clickCard(context.youreMyOnlyHope);
                expect(context.youreMyOnlyHope).toBeInZone('discard', context.player1);

                expect(context.player2).toBeActivePlayer();
            });
        });
    });
});
