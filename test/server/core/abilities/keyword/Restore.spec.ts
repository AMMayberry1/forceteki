describe('Restore keyword', function() {
    integration(function(contextRef) {
        describe('When a unit with the Restore keyword', function() {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        groundArena: ['regional-sympathizers'],
                    },
                    player2: {
                        hand: ['waylay']
                    }
                });
            });

            it('attacks, base should be healed by the restore amount', function () {
                const { context } = contextRef;

                context.setDamage(context.p1Base, 5);

                // attack resolves automatically since there's only one target (p2Base)
                context.player1.clickCard(context.regionalSympathizers);

                expect(context.p1Base.damage).toBe(3);
                expect(context.p2Base.damage).toBe(3);
                expect(context.regionalSympathizers.exhausted).toBe(true);
            });

            it('is removed from play and played again it should not gain an additional restore keyword', function() {
                const { context } = contextRef;
                context.setDamage(context.p1Base, 5);

                context.player1.passAction();
                context.player2.clickCard(context.waylay);

                context.player1.clickCard(context.regionalSympathizers);
                context.regionalSympathizers.exhausted = false;
                context.player2.passAction();

                context.player1.clickCard(context.regionalSympathizers);
                expect(context.p1Base.damage).toBe(3);
                expect(context.p2Base.damage).toBe(3);
                expect(context.regionalSympathizers.exhausted).toBe(true);
            });
        });

        describe('When a unit with the Restore keyword and a gained Restore ability', function() {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        groundArena: [{ card: 'regional-sympathizers', upgrades: ['devotion'] }],
                    },
                    player2: {
                    }
                });
            });

            it('attacks, base should be healed by the cumulative restore amount', function () {
                const { context } = contextRef;

                context.setDamage(context.p1Base, 5);

                // attack resolves automatically since there's only one target (p2Base)
                context.player1.clickCard(context.regionalSympathizers);

                expect(context.p1Base.damage).toBe(1);
                expect(context.p2Base.damage).toBe(4);
                expect(context.regionalSympathizers.exhausted).toBe(true);

                // second attack to ensure ability deregistration is working
                context.player2.passAction();

                context.regionalSympathizers.exhausted = false;
                context.player1.clickCard(context.regionalSympathizers);
                expect(context.p1Base.damage).toBe(0);
                expect(context.p2Base.damage).toBe(8);
                expect(context.regionalSympathizers.exhausted).toBe(true);
            });
        });

        // TODO test that a card that attacked and then is bounced back to hand (i.e. Waylay) doesn't receive a second Restore instance
    });
});
