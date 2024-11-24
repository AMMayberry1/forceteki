describe('Don\'t Get Cocky', function() {
    integration(function(contextRef) {
        describe('Don\'t Get Cocky\'s ability', function() {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['dont-get-cocky'],
                        groundArena: ['pyke-sentinel'],
                        deck: ['alliance-dispatcher', 'medal-ceremony', 'wilderness-fighter', 'consortium-starviper', 'entrenched', 'karabast', 'ruthless-raider', 'swoop-racer']
                        // costs: 1, 0, 3, 3, 2, 2, 6, 3
                    },
                    player2: {
                        groundArena: ['atat-suppressor'],
                        spaceArena: ['tieln-fighter']
                    }
                });
            });

            it('should have the controller first choose any unit, then sequentially reveal cards from the top of their deck, and finally deal damage to the chosen unit equal to the combined cost of the cards revealed if it is 7 or less, while also moving the revealed cards to the bottom of the deck in a random order', function () {
                const { context } = contextRef;

                const reset = () => {
                    context.player1.readyResources(6);
                    context.player1.setDeck([context.allianceDispatcher, context.medalCeremony, context.wildernessFighter, context.consortiumStarviper, context.entrenched, context.karabast, context.ruthlessRaider, context.swoopRacer]);
                    context.player1.moveCard(context.dontGetCocky, 'hand');
                    context.setDamage(context.atatSuppressor, 0);
                    if (context.player2.actionPhaseActivePlayer === context.player2.player) {
                        context.player2.passAction();
                    }
                };

                // reveal 1 card, do 1 damage
                context.player1.clickCard(context.dontGetCocky);
                expect(context.player1).toBeAbleToSelectExactly([context.pykeSentinel, context.atatSuppressor, context.tielnFighter]);

                context.player1.clickCard(context.atatSuppressor);
                expect(context.getChatLogs(1)).toContain('player1 reveals Alliance Dispatcher due to Don\'t Get Cocky');
                expect(context.player1).toHavePrompt('Current total cost: 1\nSelect one:');
                expect(context.player1).toHaveEnabledPromptButtons(['Reveal another card', 'Stop revealing cards']);

                context.player1.clickPrompt('Stop revealing cards');
                expect(context.atatSuppressor.damage).toBe(1);
                expect([context.allianceDispatcher]).toAllBeInBottomOfDeck(context.player1, 1);
                expect(context.player1Object.getTopCardOfDeck()).toBe(context.medalCeremony);

                reset();

                // reveal 4 cards, do exactly 7 damage
                context.player1.clickCard(context.dontGetCocky);
                context.player1.clickCard(context.atatSuppressor);
                expect(context.getChatLogs(1)).toContain('player1 reveals Alliance Dispatcher due to Don\'t Get Cocky');

                context.player1.clickPrompt('Reveal another card');
                expect(context.getChatLogs(1)).toContain('player1 reveals Medal Ceremony due to Don\'t Get Cocky');
                expect(context.player1).toHavePrompt('Current total cost: 1\nSelect one:');
                expect(context.player1).toHaveEnabledPromptButtons(['Reveal another card', 'Stop revealing cards']);

                context.player1.clickPrompt('Reveal another card');
                expect(context.getChatLogs(1)).toContain('player1 reveals Wilderness Fighter due to Don\'t Get Cocky');
                expect(context.player1).toHavePrompt('Current total cost: 4\nSelect one:');
                expect(context.player1).toHaveEnabledPromptButtons(['Reveal another card', 'Stop revealing cards']);

                context.player1.clickPrompt('Reveal another card');
                expect(context.getChatLogs(1)).toContain('player1 reveals Consortium StarViper due to Don\'t Get Cocky');
                expect(context.player1).toHavePrompt('Current total cost: 7\nSelect one:');
                expect(context.player1).toHaveEnabledPromptButtons(['Reveal another card', 'Stop revealing cards']);

                context.player1.clickPrompt('Stop revealing cards');
                expect(context.atatSuppressor.damage).toBe(7);
                expect([context.allianceDispatcher, context.medalCeremony, context.wildernessFighter, context.consortiumStarviper]).toAllBeInBottomOfDeck(context.player1, 4);
                expect(context.player1Object.getTopCardOfDeck()).toBe(context.entrenched);

                reset();

                // reveal 5 cards, do no damage because the total cost is too high
                context.player1.clickCard(context.dontGetCocky);
                context.player1.clickCard(context.atatSuppressor);

                context.player1.clickPrompt('Reveal another card');
                context.player1.clickPrompt('Reveal another card');
                context.player1.clickPrompt('Reveal another card');
                context.player1.clickPrompt('Reveal another card');
                expect(context.player1).toHavePrompt('Current total cost: 9\nSelect one:');
                context.player1.clickPrompt('Stop revealing cards');
                expect(context.atatSuppressor.damage).toBe(0);
                expect([context.allianceDispatcher, context.medalCeremony, context.wildernessFighter, context.consortiumStarviper, context.entrenched]).toAllBeInBottomOfDeck(context.player1, 5);
                expect(context.player1Object.getTopCardOfDeck()).toBe(context.karabast);

                reset();

                // the controller can continue revealing cards regardless of total cost so far, up to 7 cards maximum
                context.player1.clickCard(context.dontGetCocky);
                context.player1.clickCard(context.atatSuppressor);

                context.player1.clickPrompt('Reveal another card');
                context.player1.clickPrompt('Reveal another card');
                context.player1.clickPrompt('Reveal another card');
                context.player1.clickPrompt('Reveal another card');
                context.player1.clickPrompt('Reveal another card');
                expect(context.player1).toHavePrompt('Current total cost: 11\nSelect one:');
                context.player1.clickPrompt('Reveal another card');
                // 7 cards revealed, no choices left
                expect(context.player2).toBeActivePlayer();
                expect(context.atatSuppressor.damage).toBe(0);
                expect(context.player1Object.getTopCardOfDeck()).toBe(context.swoopRacer);

                reset();

                // with only 3 cards in deck, the controller should be able to sequentially reveal all 3, after which the ability immediately ends and does damage equal to their total cost
                context.player1.setDeck([context.medalCeremony, context.consortiumStarviper, context.entrenched]);

                context.player1.clickCard(context.dontGetCocky);
                context.player1.clickCard(context.atatSuppressor);

                context.player1.clickPrompt('Reveal another card');
                context.player1.clickPrompt('Reveal another card');

                expect(context.player2).toBeActivePlayer();
                expect(context.atatSuppressor.damage).toBe(5);
                expect([context.medalCeremony, context.consortiumStarviper, context.entrenched]).toAllBeInBottomOfDeck(context.player1, 3);

                reset();

                // with no cards in deck, nothing happens
                context.player1.setDeck([]);

                context.player1.clickCard(context.dontGetCocky);
                context.player1.clickCard(context.atatSuppressor);

                expect(context.player2).toBeActivePlayer();
                expect(context.atatSuppressor.damage).toBe(0);
            });
        });
    });
});
