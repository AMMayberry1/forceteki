describe('Bounty Guild Initiate', function() {
    integration(function(contextRef) {
        describe('Bounty Guild Initiate\'s ability', function() {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['bounty-guild-initiate'],
                        groundArena: ['greedo#slow-on-the-draw'],
                    },
                    player2: {
                        groundArena: ['wampa'],
                        spaceArena: ['green-squadron-awing']
                    }
                });
            });

            it('should deal 2 damage to unit because we control another Bounty Hunter unit.', function () {
                const { context } = contextRef;
                context.player1.clickCard(context.bountyGuildInitiate);
                // should select ground unit of both players
                expect(context.player1).toBeAbleToSelectExactly([context.wampa, context.greedo, context.bountyGuildInitiate]);
                expect(context.player1).toHavePassAbilityButton();
                context.player1.clickCard(context.wampa);
                expect(context.wampa.damage).toBe(2);
                expect(context.player2).toBeActivePlayer();
            });
        });

        describe('Bounty Guild Initiate\'s ability', function() {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['bounty-guild-initiate'],
                        groundArena: ['battlefield-marine'],
                    },
                    player2: {
                        groundArena: ['wampa', 'greedo#slow-on-the-draw']
                    }
                });
            });

            it('should not deal 2 damage to unit because we do not control another Bounty Hunter unit.', function () {
                const { context } = contextRef;
                context.player1.clickCard(context.bountyGuildInitiate);
                expect(context.wampa.damage).toBe(0);
                expect(context.greedo.damage).toBe(0);
                expect(context.battlefieldMarine.damage).toBe(0);
                expect(context.player2).toBeActivePlayer();
            });
        });
    });
});
