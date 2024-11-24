describe('Bounty', function() {
    integration(function(contextRef) {
        describe('When a unit with a Bounty ability', function() {
            it('is defeated by the opponent, the ability should resolve under the opponent\'s control', function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        groundArena: ['hylobon-enforcer']
                    },
                    player2: {
                        groundArena: ['wampa']
                    }
                });

                const { context } = contextRef;

                context.player1.clickCard(context.hylobonEnforcer);
                context.player1.clickCard(context.wampa);

                expect(context.player2).toHavePassAbilityPrompt('Bounty: Draw a card');
                context.player2.clickPrompt('Bounty: Draw a card');

                expect(context.player1.handSize).toBe(0);
                expect(context.player2.handSize).toBe(1);
                expect(context.player2).toBeActivePlayer();
            });

            it('gained from an effect is defeated, the ability should resolve under the opponent\'s control', function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        groundArena: [
                            { card: 'battlefield-marine', upgrades: ['top-target'] },
                            { card: 'atst', damage: 5 }
                        ]
                    },
                    player2: {
                        groundArena: ['wampa']
                    }
                });

                const { context } = contextRef;

                context.player1.clickCard(context.battlefieldMarine);
                context.player1.clickCard(context.wampa);

                expect(context.player2).toBeAbleToSelectExactly([context.p1Base, context.p2Base, context.wampa, context.atst]);
                expect(context.player2).toHavePassAbilityButton();
                context.player2.clickCard(context.atst);
                expect(context.atst.damage).toBe(1);
                expect(context.player2).toBeActivePlayer();
            });

            it('is defeated by the controller, the ability should resolve under the opponent\'s control', function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['vanquish'],
                        groundArena: ['hylobon-enforcer']
                    }
                });

                const { context } = contextRef;

                context.player1.clickCard(context.vanquish);

                expect(context.player2).toHavePassAbilityPrompt('Bounty: Draw a card');
                context.player2.clickPrompt('Bounty: Draw a card');

                expect(context.player1.handSize).toBe(0);
                expect(context.player2.handSize).toBe(1);
                expect(context.player2).toBeActivePlayer();
            });

            // TODO CAPTURE: add Bounty resolution tests with Capture
            // TODO: check that bounty does not happen when the card is returned to hand, for both printed and attached bounties

            it('is on the field, it should be targetable by abilities filtering for Bounty', function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['covetous-rivals', 'waylay'],
                        groundArena: ['fugitive-wookiee', 'battlefield-marine', { card: 'atst', upgrades: ['wanted'] }]
                    },
                    player2: {
                        groundArena: ['wampa', 'hylobon-enforcer'],
                        spaceArena: ['cartel-turncoat']
                    }
                });

                const { context } = contextRef;

                // can target both printed and gained Bounty
                context.player1.clickCard(context.covetousRivals);
                expect(context.player1).toBeAbleToSelectExactly([context.fugitiveWookiee, context.hylobonEnforcer, context.cartelTurncoat, context.atst]);

                context.player1.clickCard(context.cartelTurncoat);
                expect(context.cartelTurncoat.damage).toBe(2);
                expect(context.player2).toBeActivePlayer();

                context.player2.passAction();
                context.covetousRivals.exhausted = false;
            });

            it('leaves play it should not trigger the bounty twice', function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['waylay'],
                        groundArena: [{ card: 'atst', upgrades: ['top-target'] }]
                    },
                    player2: {
                        groundArena: ['hylobon-enforcer'],
                        hand: ['waylay'],
                    }
                });

                const { context } = contextRef;
                context.firstWaylay = context.player1.hand[0];
                context.secondWaylay = context.player2.hand[0];

                // check that the bounty isn't triggered when removed from play
                context.player1.clickCard(context.firstWaylay);
                context.player1.clickCard(context.hylobonEnforcer);

                // return atst to hand without collecting bounty
                expect(context.player2).toBeActivePlayer();
                context.player2.clickCard(context.secondWaylay);
                expect(context.player1).toBeActivePlayer();
            });

            it('should not trigger twice when removed from play', function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['waylay'],
                        groundArena: ['atst']
                    },
                    player2: {
                        groundArena: ['hylobon-enforcer'],
                    }
                });

                // We now defeat it to check it doesn't trigger twice.
                const { context } = contextRef;
                context.player1.clickCard(context.waylay);
                context.player1.clickCard(context.hylobonEnforcer);

                context.player2.clickCard(context.hylobonEnforcer);
                context.player1.clickCard(context.atst);
                context.player1.clickCard(context.hylobonEnforcer);

                expect(context.player1).toHavePassAbilityPrompt('Bounty: Draw a card');
                context.player1.clickPrompt('Bounty: Draw a card');

                expect(context.player1.handSize).toBe(1);
                expect(context.player2.handSize).toBe(0);
                expect(context.player2).toBeActivePlayer();
            });
        });
    });
});
