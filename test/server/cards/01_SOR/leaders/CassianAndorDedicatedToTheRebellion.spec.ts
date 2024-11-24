describe('Cassian Andor, Dedicated to the Rebellion', function() {
    integration(function(contextRef) {
        describe('Cassian Andor\'s leader ability', function() {
            it('should draw a card aftering dealing 3 damage to an enemy base with an attack', function() {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['daring-raid', 'daring-raid'],
                        deck: ['k2so#cassians-counterpart', 'open-fire'],
                        spaceArena: ['green-squadron-awing'],
                        leader: 'cassian-andor#dedicated-to-the-rebellion',
                        resources: 4,
                    },
                    player2: {
                        groundArena: ['wampa'],
                        spaceArena: ['tieln-fighter'],
                    },
                });
                const { context } = contextRef;

                // Expect this ability be available, but performs a no-op since 3 damage hasn't been dealt yet
                expect(context.cassianAndor).toHaveAvailableActionWhenClickedBy(context.player1);
                expect(context.cassianAndor.exhausted).toBeTrue();
                expect(context.player1.exhaustedResourceCount).toBe(1);

                context.cassianAndor.exhausted = false;
                context.player2.passAction();

                // Select the a-wing to deal 3 damage to base
                context.player1.clickCard(context.greenSquadronAwing);
                context.player1.clickCard(context.p2Base);
                context.player2.passAction();

                // Expect this ability have activated now - so it should draw the top card from the deck
                expect(context.cassianAndor).toHaveAvailableActionWhenClickedBy(context.player1);
                expect(context.cassianAndor.exhausted).toBeTrue();
                expect(context.player1.exhaustedResourceCount).toBe(2);
                expect(context.player1.hand).toContain(context.k2so);

                context.moveToNextActionPhase();

                // Expect this ability to be a no-op again since its a new action phase
                expect(context.cassianAndor).toHaveAvailableActionWhenClickedBy(context.player1);
                expect(context.cassianAndor.exhausted).toBeTrue();
                expect(context.player1.exhaustedResourceCount).toBe(1);

                context.cassianAndor.exhausted = false;
                context.player2.passAction();

                // Deal 3+ damage using abilities now -- use two daring raids at the top of the hand
                context.player1.clickCard(context.player1.hand[0]);
                context.player1.clickCard(context.p2Base);
                context.player2.passAction();

                // Select the remaining daring-raid
                context.player1.clickCard(context.player1.hand[0]);
                context.player1.clickCard(context.p2Base);
                context.player2.passAction();

                expect(context.player1.exhaustedResourceCount).toBe(3);

                // Expect this ability have activated now - so it should draw the top card from the deck
                expect(context.cassianAndor).toHaveAvailableActionWhenClickedBy(context.player1);
                expect(context.cassianAndor.exhausted).toBeTrue();
                expect(context.player1.exhaustedResourceCount).toBe(4);
                expect(context.player1.hand).toContain(context.openFire);
            });
        });

        describe('Cassian Andor\'s leader unit ability', function() {
            it('should draw a card when you deal damage to an enemy base, but only once a round', function() {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        deck: ['k2so#cassians-counterpart', 'red-three#unstoppable'],
                        hand: ['daring-raid'],
                        groundArena: ['yoda#old-master'],
                        spaceArena: ['green-squadron-awing'],
                        leader: { card: 'cassian-andor#dedicated-to-the-rebellion', deployed: true },
                        resources: 4,
                    },
                    player2: {
                        groundArena: ['wampa'],
                        spaceArena: ['tieln-fighter'],
                    },
                });

                const { context } = contextRef;

                expect(context.player1.hand).toHaveSize(1);

                // Select yoda to deal damage (less than 3 for sanity check) to base
                context.player1.clickCard(context.yoda);
                context.player1.clickCard(context.p2Base);

                expect(context.player1.hand).toHaveSize(2);
                expect(context.player1.hand).toContain(context.k2so);
                expect(context.player1.exhaustedResourceCount).toBe(0); // no resources spent now

                context.player2.passAction();

                // Deal more damage to base to see if another event will trigger - it shouldn't
                context.player1.clickCard(context.greenSquadronAwing);
                context.player1.clickCard(context.p2Base);

                // No card draw should have happened due to once per round limit -- state should be the same
                expect(context.player1.hand).toHaveSize(2);
                expect(context.player1.hand).toContain(context.k2so);
                expect(context.player1.exhaustedResourceCount).toBe(0);

                // Test limit 1 per round resets on next action phase
                context.moveToNextActionPhase();

                // Select daring-raid to deal damage via ability
                context.player1.clickCard(context.daringRaid);
                context.player1.clickCard(context.p2Base);

                context.player2.passAction();

                // Expect to have spent daring-raid and gained red three
                expect(context.player1.hand).toHaveSize(2);
                expect(context.player1.hand).toContain(context.redThree);
            });
        });
    });
});
