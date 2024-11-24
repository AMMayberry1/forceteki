describe('Freetown Backup', function() {
    integration(function(contextRef) {
        describe('Freetown Backup\'s modify stats ability', function() {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        groundArena: ['freetown-backup', 'battlefield-marine'],
                        spaceArena: ['concord-dawn-interceptors'],
                        leader: { card: 'boba-fett#daimyo', deployed: true }
                    },
                    player2: {
                        groundArena: ['wampa'],
                        spaceArena: ['cartel-spacer'],
                        leader: { card: 'grand-moff-tarkin#oversector-governor', deployed: true }
                    }
                });
            });

            it('requires the player to modify stats of another friendly unit', function () {
                const { context } = contextRef;

                // Attack with Freetown Backup
                context.player1.clickCard(context.freetownBackup);
                context.player1.clickCard(context.p2Base);

                expect(context.player1).toBeAbleToSelectExactly(
                    [context.battlefieldMarine, context.bobaFettDaimyo, context.concordDawnInterceptors]
                );
                context.player1.clickCard(context.battlefieldMarine);
                expect(context.battlefieldMarine.getPower()).toBe(5);
                expect(context.battlefieldMarine.getHp()).toBe(5);

                context.moveToNextActionPhase();
                expect(context.battlefieldMarine.getPower()).toBe(3);
                expect(context.battlefieldMarine.getHp()).toBe(3);
            });
        });
    });
});
