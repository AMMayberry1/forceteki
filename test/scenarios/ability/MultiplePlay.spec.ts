describe('Abilities', function() {
    integration(function (contextRef) {
        describe('When played ability, on attack ability', function () {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        deck: ['foundling', 'pyke-sentinel', 'atst', 'cartel-spacer', 'wampa'],
                        groundArena: ['rugged-survivors'],
                        leader: { card: 'chirrut-imwe#one-with-the-force', deployed: true },
                        spaceArena: ['patrolling-vwing']
                    },
                    player2: {
                        groundArena: ['battlefield-marine'],
                        hand: ['waylay', 'waylay']
                    }
                });
                const { context } = contextRef;
                context.firstWaylay = context.player2.hand[0];
                context.secondWaylay = context.player2.hand[1];
            });

            it('on attack ability should trigger only once after the unit was removed from play and played again', function () {
                const { context } = contextRef;

                // CASE 1: we test the on attack ability
                context.player1.passAction();
                context.player2.clickCard(context.firstWaylay);
                context.player2.clickCard(context.ruggedSurvivors);

                context.player1.clickCard(context.ruggedSurvivors);
                context.ruggedSurvivors.exhausted = false;
                context.player2.passAction();

                context.player1.clickCard(context.ruggedSurvivors);
                context.player1.clickCard(context.p2Base);
                context.player1.clickPrompt('Draw a card if you control a leader unit');

                // check board state
                expect(context.player1.hand.length).toBe(1);
            });

            it('on play ability should trigger only once after the unit was removed from play and played again', function() {
                const { context } = contextRef;
                context.player1.passAction();

                context.player2.clickCard(context.secondWaylay);
                context.player2.clickCard(context.patrollingVwing);
                context.player1.clickCard(context.patrollingVwing);

                // check board state
                expect(context.player1.hand.length).toBe(1);
            });
        });

        describe('Constant abilities', function () {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['waylay'],
                        groundArena: ['rugged-survivors', 'supreme-leader-snoke#shadow-ruler'],
                    },
                    player2: {
                        groundArena: ['battlefield-marine', 'general-dodonna#massassi-group-commander'],
                        hand: ['waylay']
                    }
                });
                const { context } = contextRef;
                context.firstWaylay = context.player1.hand[0];
                context.secondWaylay = context.player2.hand[0];
            });

            it('negative constant effects should only trigger once after the unit was removed from play and played again',
                function () {
                    const { context } = contextRef;

                    // check pre-board state to see if both effects work
                    context.player1.passAction();
                    expect(context.battlefieldMarine.getPower()).toBe(2);
                    expect(context.battlefieldMarine.getHp()).toBe(2);

                    context.player2.clickCard(context.secondWaylay);
                    context.player2.clickCard(context.supremeLeaderSnoke);

                    // check board state
                    expect(context.battlefieldMarine.getPower()).toBe(4);
                    expect(context.battlefieldMarine.getHp()).toBe(4);

                    // play snoke and check board state
                    context.player1.clickCard(context.supremeLeaderSnoke);
                    expect(context.battlefieldMarine.getPower()).toBe(2);
                    expect(context.battlefieldMarine.getHp()).toBe(2);
                });

            it('positive constant effects should only trigger once after the unit was removed from play and played again',
                function () {
                    const { context } = contextRef;

                    // check pre-board state to see if both effects work
                    expect(context.battlefieldMarine.getPower()).toBe(2);
                    expect(context.battlefieldMarine.getHp()).toBe(2);

                    context.player1.clickCard(context.firstWaylay);
                    context.player1.clickCard(context.generalDodonna);

                    // check board state
                    expect(context.battlefieldMarine.getPower()).toBe(1);
                    expect(context.battlefieldMarine.getHp()).toBe(1);

                    // play general dodonna and check board state
                    context.player2.clickCard(context.generalDodonna);
                    expect(context.battlefieldMarine.getPower()).toBe(2);
                    expect(context.battlefieldMarine.getHp()).toBe(2);
                });
        });
        describe('cost reduction', function () {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['reputable-hunter'],
                        base: 'energy-conversion-lab',
                    },
                    player2: {
                        groundArena: [{ card: 'battlefield-marine', upgrades: ['top-target'] }],
                        hand: ['waylay']
                    }
                });
            });

            it('should only trigger once after the unit was removed from play and played again', function () {
                const { context } = contextRef;

                context.player1.clickCard(context.reputableHunter);
                expect(context.player1.exhaustedResourceCount).toBe(2);

                context.player2.clickCard(context.waylay);
                context.player2.clickCard(context.reputableHunter);

                // Player 1 plays reputable hunter again
                context.player1.clickCard(context.reputableHunter);

                // we check board state
                expect(context.player1.exhaustedResourceCount).toEqual(4);
            });
        });
        describe('when defeated', function () {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['the-emperors-legion'],
                        spaceArena: ['rhokai-gunship']
                    },
                    player2: {
                        spaceArena: ['desperado-freighter']
                    }
                });
            });

            it('should only trigger once after the unit was defeated, returned and played again', function () {
                const { context } = contextRef;
                context.player1.clickCard(context.rhokaiGunship);
                context.player1.clickCard(context.desperadoFreighter);
                context.player1.clickCard(context.p2Base);

                // check board state
                expect(context.p2Base.damage).toBe(1);
                expect(context.player2).toBeActivePlayer();
                context.player2.passAction();

                // return the unit and play it again
                context.player1.clickCard(context.theEmperorsLegion);
                context.player2.passAction();
                context.player1.clickCard(context.rhokaiGunship);

                context.rhokaiGunship.exhausted = false;
                context.player2.passAction();

                context.player1.clickCard(context.rhokaiGunship);
                context.player1.clickCard(context.desperadoFreighter);

                context.player1.clickCard(context.p2Base);

                // check board state
                expect(context.p2Base.damage).toBe(2);
                expect(context.player2).toBeActivePlayer();
            });
        });
    });
});