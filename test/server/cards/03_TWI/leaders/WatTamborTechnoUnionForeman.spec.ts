describe('Wat Tambor, Techno Union Foreman', function () {
    integration(function (contextRef) {
        describe('Wat Tambor\'s leader ability', function () {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        groundArena: ['battlefield-marine', 'guardian-of-the-whills'],
                        spaceArena: ['green-squadron-awing'],
                        leader: 'wat-tambor#techno-union-foreman',
                        resources: 4,
                    },
                    player2: {
                        groundArena: ['admiral-yularen#advising-caution'],
                    },
                });
            });

            it('should not give +2/+2 to a unit if no friendly unit was defeat this phase', function () {
                const { context } = contextRef;

                context.player1.clickCard(context.watTambor);
                expect(context.player2).toBeActivePlayer();
            });

            it('should give +2/+2 to a unit this phase because a friendly unit was defeat this phase', function () {
                const { context } = contextRef;

                context.player1.passAction();

                // yularen kill our guardian of the whills
                context.player2.clickCard(context.admiralYularen);
                context.player2.clickCard(context.guardianOfTheWhills);

                // wat tambor should give +2/+2 to any unit
                context.player1.clickCard(context.watTambor);
                expect(context.player1).toBeAbleToSelectExactly([context.battlefieldMarine, context.greenSquadronAwing, context.admiralYularen]);
                expect(context.player1).not.toHavePassAbilityButton();
                expect(context.player1).not.toHaveChooseNoTargetButton();

                // give +2/+2 to battlefield marine
                context.player1.clickCard(context.battlefieldMarine);
                expect(context.player2).toBeActivePlayer();
                expect(context.battlefieldMarine.getPower()).toBe(5);
                expect(context.battlefieldMarine.getHp()).toBe(5);
                expect(context.watTambor.exhausted).toBeTrue();

                // kill yularen (5 hp)
                context.setDamage(context.admiralYularen, 0);
                context.player2.passAction();
                context.player1.clickCard(context.battlefieldMarine);
                context.player1.clickCard(context.admiralYularen);
                expect(context.admiralYularen).toBeInZone('discard');

                // on next phase +2/+2 is gone
                context.moveToNextActionPhase();
                expect(context.battlefieldMarine.getPower()).toBe(3);
                expect(context.battlefieldMarine.getHp()).toBe(3);
            });
        });

        describe('Wat Tambor\'s leader deployed ability', function () {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        groundArena: ['battlefield-marine', 'guardian-of-the-whills'],
                        spaceArena: ['green-squadron-awing'],
                        leader: { card: 'wat-tambor#techno-union-foreman', deployed: true },
                    },
                    player2: {
                        groundArena: ['admiral-yularen#advising-caution', 'alliance-dispatcher'],
                    },
                });
            });

            it('should not give +2/+2 to a unit because no friendly unit was defeat this phase', function () {
                const { context } = contextRef;

                context.player1.clickCard(context.watTambor);
                context.player1.clickCard(context.p2Base);
                expect(context.player2).toBeActivePlayer();
            });

            it('should not give +2/+2 to a unit because no friendly unit was defeat this phase (will kill a unit)', function () {
                const { context } = contextRef;

                context.player1.clickCard(context.watTambor);
                context.player1.clickCard(context.allianceDispatcher);
                expect(context.player2).toBeActivePlayer();
            });

            it('should give +2/+2 to a unit for the phase because a friendly unit was defeat this phase', function () {
                const { context } = contextRef;

                context.player1.passAction();

                // yularen kill our guardian of the whills
                context.player2.clickCard(context.admiralYularen);
                context.player2.clickCard(context.guardianOfTheWhills);

                // wat tambor should give +2/+2 to any unit
                context.player1.clickCard(context.watTambor);
                context.player1.clickCard(context.p2Base);
                expect(context.player1).toBeAbleToSelectExactly([context.battlefieldMarine, context.greenSquadronAwing, context.admiralYularen, context.allianceDispatcher]);
                expect(context.player1).toHavePassAbilityButton();

                // give +2/+2 to battlefield marine
                context.player1.clickCard(context.battlefieldMarine);
                expect(context.player2).toBeActivePlayer();
                expect(context.battlefieldMarine.getPower()).toBe(5);
                expect(context.battlefieldMarine.getHp()).toBe(5);

                // kill yularen (5 hp)
                context.setDamage(context.admiralYularen, 0);
                context.player2.passAction();
                context.player1.clickCard(context.battlefieldMarine);
                context.player1.clickCard(context.admiralYularen);
                expect(context.admiralYularen).toBeInZone('discard');

                // on next phase +2/+2 is gone
                context.moveToNextActionPhase();
                expect(context.battlefieldMarine.getPower()).toBe(3);
                expect(context.battlefieldMarine.getHp()).toBe(3);
            });
        });
    });
});
