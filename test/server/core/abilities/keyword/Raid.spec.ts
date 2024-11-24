describe('Raid keyword', function() {
    integration(function(contextRef) {
        describe('When a unit with the Raid keyword', function() {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        groundArena: ['cantina-braggart'],
                    },
                    player2: {
                        groundArena: ['battlefield-marine'],
                        hand: ['waylay']
                    }
                });
            });

            it('attacks, power should be increased by raid amount', function () {
                const { context } = contextRef;

                context.player1.clickCard(context.cantinaBraggart);
                context.player1.clickCard(context.p2Base);
                expect(context.cantinaBraggart.exhausted).toBe(true);
                expect(context.cantinaBraggart.getPower()).toBe(0);
                expect(context.p2Base.damage).toBe(2);

                context.cantinaBraggart.exhausted = false;
                context.player2.passAction();

                context.player1.clickCard(context.cantinaBraggart);
                context.player1.clickCard(context.p2Base);
                expect(context.cantinaBraggart.getPower()).toBe(0);
                expect(context.p2Base.damage).toBe(4);
            });

            it('defends, power should not be increased by raid amount', function () {
                const { context } = contextRef;

                context.player2.setActivePlayer();
                context.player2.clickCard(context.battlefieldMarine);
                context.player2.clickCard(context.cantinaBraggart);

                expect(context.battlefieldMarine.damage).toBe(0);
                expect(context.cantinaBraggart).toBeInZone('discard');
            });

            it('is removed from play and played again it shouldn\'t have an additional raid.', function () {
                const { context } = contextRef;
                context.player1.passAction();
                context.player2.clickCard(context.waylay);
                context.player2.clickCard(context.cantinaBraggart);

                context.player1.clickCard(context.cantinaBraggart);
                context.cantinaBraggart.exhausted = false;
                context.player2.passAction();

                context.player1.clickCard(context.cantinaBraggart);
                context.player1.clickCard(context.p2Base);
                expect(context.cantinaBraggart.exhausted).toBe(true);
                expect(context.cantinaBraggart.getPower()).toBe(0);
                expect(context.p2Base.damage).toBe(2);
            });
        });

        describe('When a unit with the Raid keyword and a gained Raid ability', function() {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        spaceArena: ['red-three#unstoppable', 'green-squadron-awing']
                    },
                    player2: {
                    }
                });
            });

            it('attacks, base should have the cumulative raid amount', function () {
                const { context } = contextRef;

                context.player1.clickCard(context.greenSquadronAwing);
                expect(context.p2Base.damage).toBe(4);
            });
        });

        // TODO test that a card that attacked and then is bounced back to hand (i.e. Waylay) doesn't receive a second Raid buff
    });
});
