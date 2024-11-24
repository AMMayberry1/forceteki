describe('Sentinel keyword', function() {
    integration(function(contextRef) {
        describe('When a unit with the Sentinel keyword', function() {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['waylay'],
                        groundArena: ['liberated-slaves'],
                    },
                    player2: {
                        groundArena: ['echo-base-defender', 'battlefield-marine', 'wookiee-warrior'],
                        spaceArena: ['system-patrol-craft', 'seventh-fleet-defender', 'imperial-interceptor'],
                    }
                });
            });

            it('is in play, it must be targeted by an attack', function () {
                const { context } = contextRef;

                context.player1.clickCard(context.liberatedSlaves);
                expect(context.liberatedSlaves.exhausted).toBe(true);
                expect(context.p2Base.damage).toBe(0);
                expect(context.liberatedSlaves.damage).toBe(4);
                expect(context.echoBaseDefender).toBeInZone('discard');
            });

            it('is removed from play and played again it should retain its 1 keyword', function() {
                const { context } = contextRef;

                context.player1.clickCard(context.waylay);
                context.player1.clickCard(context.echoBaseDefender);

                context.player2.clickCard(context.echoBaseDefender);
                context.player1.clickCard(context.liberatedSlaves);

                // check board state
                expect(context.liberatedSlaves.exhausted).toBe(true);
                expect(context.p2Base.damage).toBe(0);
                expect(context.liberatedSlaves.damage).toBe(4);
                expect(context.echoBaseDefender).toBeInZone('discard');
            });
        });

        describe('When two units with the Sentinel keyword', function() {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        groundArena: ['liberated-slaves'],
                    },
                    player2: {
                        groundArena: ['echo-base-defender', 'pyke-sentinel', 'battlefield-marine', 'wookiee-warrior'],
                        spaceArena: ['system-patrol-craft', 'seventh-fleet-defender', 'imperial-interceptor']
                    }
                });
            });

            it('are in play, either may be targeted by an attack', function () {
                const { context } = contextRef;

                context.player1.clickCard(context.liberatedSlaves);
                expect(context.player1).toBeAbleToSelectExactly([context.pykeSentinel, context.echoBaseDefender]);
                context.player1.clickCard(context.echoBaseDefender);
                expect(context.liberatedSlaves.exhausted).toBe(true);
                expect(context.p2Base.damage).toBe(0);
                expect(context.liberatedSlaves.damage).toBe(4);
                expect(context.echoBaseDefender).toBeInZone('discard');
            });
        });

        describe('When attacker can attack both arena while there are Sentinel on both arena', function () {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        spaceArena: ['strafing-gunship'],
                    },
                    player2: {
                        groundArena: ['r2d2#ignoring-protocol', 'echo-base-defender'],
                        spaceArena: ['pirated-starfighter', 'corellian-freighter']
                    }
                });
            });

            it('should attack only sentinel if there is a space sentinel', function () {
                const { context } = contextRef;

                const reset = () => {
                    context.strafingGunship.damage = 0;
                    context.strafingGunship.exhausted = false;
                    context.player2.passAction();
                };

                context.player1.clickCard(context.strafingGunship);
                // with space sentinel strafing gunship can only attack space sentinel and ground sentinel
                expect(context.player1).toBeAbleToSelectExactly([context.echoBaseDefender, context.corellianFreighter]);
                context.player1.clickCard(context.echoBaseDefender);
                expect(context.player2).toBeActivePlayer();
                expect(context.echoBaseDefender.zoneName).toBe('discard');
                expect(context.strafingGunship.damage).toBe(2);

                reset();

                context.player1.clickCard(context.strafingGunship);
                // corellian freighter is chosen automatically because it has sentinel
                expect(context.player2).toBeActivePlayer();
                expect(context.strafingGunship.zoneName).toBe('discard');
                expect(context.corellianFreighter.damage).toBe(3);
            });
        });

        describe('When attack can attack both arena while there are Sentinel only on ground arena', function () {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        spaceArena: ['strafing-gunship'],
                    },
                    player2: {
                        groundArena: ['r2d2#ignoring-protocol', 'echo-base-defender'],
                        spaceArena: ['pirated-starfighter']
                    }
                });
            });

            it('should ignore ground sentinel while there is not space sentinel', function () {
                const { context } = contextRef;
                context.player1.clickCard(context.strafingGunship);
                // no space sentinel : can attack anyone
                expect(context.player1).toBeAbleToSelectExactly([context.echoBaseDefender, context.piratedStarfighter, context.r2d2, context.p2Base]);
                context.player1.clickCard(context.r2d2);
                expect(context.player2).toBeActivePlayer();
                expect(context.r2d2.damage).toBe(3);
                expect(context.strafingGunship.damage).toBe(0);
            });
        });
    });
});
