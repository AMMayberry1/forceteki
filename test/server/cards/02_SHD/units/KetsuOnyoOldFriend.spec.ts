describe('Ketsu Onyo, Old friend', function() {
    integration(function(contextRef) {
        describe('Ketsu Onyo\'s ability', function() {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        groundArena: [{ card: 'battlefield-marine', upgrades: ['entrenched'] }, { card: 'ketsu-onyo#old-friend', upgrades: ['heroic-resolve'] }],
                    },
                    player2: {
                        groundArena: [{ card: 'grogu#irresistible' }, { card: 'pyke-sentinel', upgrades: ['fallen-lightsaber'] }],
                        spaceArena: [{ card: 'imperial-interceptor', upgrades: ['academy-training'] }],
                        base: 'chopper-base'
                    }
                });
            });

            it('can defeat an upgrade that costs 2 or less', function () {
                const { context } = contextRef;

                const reset = (passAction = true) => {
                    context.ketsuOnyoOldFriend.exhausted = false;
                    context.ketsuOnyoOldFriend.damage = 0;
                    context.groguIrresistible.damage = 0;
                    context.chopperBase.damage = 0;
                    if (passAction) {
                        context.player2.passAction();
                    }
                };

                // CASE 1: Can defeat an upgrade that costs 2 or less
                context.player1.clickCard(context.ketsuOnyoOldFriend);
                context.player1.clickPrompt('Attack');
                expect(context.player1).toBeAbleToSelectExactly([context.groguIrresistible, context.pykeSentinel, context.chopperBase]);
                context.player1.clickCard(context.chopperBase);
                expect(context.player1).toBeAbleToSelectExactly([context.entrenched, context.heroicResolve, context.academyTraining]);
                context.player1.clickPrompt('Pass ability');

                // CASE 2: Cannot defeat an upgrade after attacking a unit
                reset();
                context.player1.clickCard(context.ketsuOnyoOldFriend);
                context.player1.clickPrompt('Attack');
                expect(context.player1).toBeAbleToSelectExactly([context.groguIrresistible, context.pykeSentinel, context.chopperBase]);
                context.player1.clickCard(context.groguIrresistible);
                expect(context.groguIrresistible.damage).toBe(4);
                expect(context.player2).toBeActivePlayer();

                // CASE 3: Should trigger ability from overwhelm damage
                reset();
                context.moveToNextActionPhase();
                context.player1.clickCard(context.ketsuOnyoOldFriend);
                context.player1.clickPrompt('Attack with this unit. It gains +4/+0 and Overwhelm for this attack.');
                context.player1.clickCard(context.pykeSentinel);
                expect(context.player1).toBeAbleToSelectExactly([context.entrenched, context.academyTraining]);
                context.player1.clickCard(context.entrenched);
                expect(context.battlefieldMarine.isUpgraded()).toBe(false);
                expect(context.player2).toBeActivePlayer();
            });
        });
    });
});
