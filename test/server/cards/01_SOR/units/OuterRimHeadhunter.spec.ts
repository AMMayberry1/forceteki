describe('Outer Rim Headhunter', function () {
    integration(function (contextRef) {
        describe('Outer Rim Headhunter\'s ability', function () {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        spaceArena: ['outer-rim-headhunter'],
                        leader: { card: 'chirrut-imwe#one-with-the-force', deployed: true }
                    },
                    player2: {
                        groundArena: ['battlefield-marine', 'scout-bike-pursuer']
                    }
                });
            });

            it('should exhaust a non-leader unit if you control a deployed leader unit', function () {
                const { context } = contextRef;

                context.player1.clickCard(context.outerRimHeadhunter);

                // can target all non leader unit
                expect(context.player1).toBeAbleToSelectExactly([context.battlefieldMarine, context.outerRimHeadhunter, context.scoutBikePursuer]);
                expect(context.player1).toHavePassAbilityButton();

                // choose battlefield marine
                context.player1.clickCard(context.battlefieldMarine);
                expect(context.battlefieldMarine.exhausted).toBeTrue();
                expect(context.chirrutImwe.exhausted).toBeFalse();
                expect(context.scoutBikePursuer.exhausted).toBeFalse();
            });
        });

        describe('Outer Rim Headhunter\'s ability', function () {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        spaceArena: ['outer-rim-headhunter'],
                    },
                    player2: {
                        groundArena: ['battlefield-marine']
                    }
                });
            });

            it('should not exhaust any unit if you do not control a deployed leader unit', function () {
                const { context } = contextRef;

                context.player1.clickCard(context.outerRimHeadhunter);
                expect(context.player2).toBeActivePlayer();
                expect(context.battlefieldMarine.exhausted).toBeFalse();
            });
        });
    });
});
