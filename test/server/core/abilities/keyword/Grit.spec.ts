describe('Grit keyword', function() {
    integration(function(contextRef) {
        describe('When a unit with the Grit keyword', function() {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        groundArena: [{ card: 'scout-bike-pursuer', damage: 2 }],
                    },
                    player2: {
                        groundArena: ['regional-governor'],
                        hand: ['waylay']
                    }
                });
            });

            it('is damaged, power should be increased by damage amount', function () {
                const { context } = contextRef;

                expect(context.scoutBikePursuer.getPower()).toBe(3);

                context.player2.setActivePlayer();
                context.player2.clickCard(context.regionalGovernor);
                context.player2.clickCard(context.scoutBikePursuer);

                expect(context.regionalGovernor.damage).toBe(3);
            });

            it('has no damage, it should not have increased power', function () {
                const { context } = contextRef;

                context.setDamage(context.scoutBikePursuer, 0);
                expect(context.scoutBikePursuer.getPower()).toBe(1);
            });

            it('is removed from play it shouldn\'t have the keyword twice.', function() {
                const { context } = contextRef;
                context.player1.passAction();
                context.player2.clickCard(context.waylay);
                context.player2.clickCard(context.scoutBikePursuer);

                context.player1.clickCard(context.scoutBikePursuer);
                context.player2.clickCard(context.regionalGovernor);
                context.player2.clickCard(context.scoutBikePursuer);

                // check board state
                expect(context.scoutBikePursuer.damage).toBe(1);
                expect(context.scoutBikePursuer.getPower()).toBe(2);
                expect(context.regionalGovernor.damage).toBe(1);
            });
        });

        describe('When a unit with the Grit keyword', function() {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        groundArena: ['sabine-wren#explosives-artist'],
                    },
                    player2: {
                        groundArena: ['wookiee-warrior'],
                    }
                });
            });

            it('gains damage when the attack is declared', function () {
                const { context } = contextRef;

                context.player1.clickCard(context.sabineWren);
                context.player1.clickCard(context.wookieeWarrior);
                expect(context.player1).toBeAbleToSelectExactly([context.wookieeWarrior, context.p1Base, context.p2Base]);
                context.player1.clickCard(context.wookieeWarrior);
                expect(context.sabineWren).toBeInZone('discard');
                expect(context.wookieeWarrior.damage).toBe(3);
                expect(context.wookieeWarrior.getPower()).toBe(5);
            });
        });
    });
});
