describe('Wrecker, Boom!', function() {
    integration(function(contextRef) {
        describe('Wrecker\'s ability', function() {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['wrecker#boom'],
                        leader: 'sabine-wren#galvanized-revolutionary',
                        groundArena: ['greedo#slow-on-the-draw'],
                        resources: ['superlaser-technician', 'battlefield-marine', 'wild-rancor', 'protector', 'devotion', 'restored-arc170']
                    },
                    player2: {
                        groundArena: ['atst'],
                        spaceArena: ['green-squadron-awing']
                    }
                });
            });

            it('should defeat a resource and deal 5 damage to a ground unit', function () {
                const { context } = contextRef;

                context.player1.clickCard(context.wrecker);

                // select a resource to defeat
                expect(context.player1).toBeAbleToSelectExactly([context.superlaserTechnician, context.battlefieldMarine, context.wildRancor, context.protector, context.devotion, context.restoredArc170]);
                expect(context.player1).toHavePassAbilityButton();
                expect(context.player1).toHaveChooseNoTargetButton();
                context.player1.clickCard(context.devotion);

                // select a ground unit to deal 5 damage
                expect(context.player1).toBeAbleToSelectExactly([context.greedo, context.wrecker, context.atst]);
                context.player1.clickCard(context.atst);

                expect(context.player1.resources.length).toBe(5);
                expect(context.devotion).toBeInZone('discard');
                expect(context.atst.damage).toBe(5);
                expect(context.player2).toBeActivePlayer();
            });

            it('should not deal 5 damage to a ground unit if we do not defeat a resource', function () {
                const { context } = contextRef;

                context.player1.clickCard(context.wrecker);

                // select a resource to defeat
                expect(context.player1).toBeAbleToSelectExactly([context.superlaserTechnician, context.battlefieldMarine, context.wildRancor, context.protector, context.devotion, context.restoredArc170]);
                expect(context.player1).toHavePassAbilityButton();
                expect(context.player1).toHaveChooseNoTargetButton();

                // as we pass nothing happen
                expect(context.player1.resources.length).toBe(6);
                context.player1.clickPrompt('Pass ability');
                expect(context.player2).toBeActivePlayer();
            });
        });
    });
});
