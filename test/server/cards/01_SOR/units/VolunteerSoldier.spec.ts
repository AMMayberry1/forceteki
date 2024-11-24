describe('Volunteer Soldier', function() {
    integration(function(contextRef) {
        describe('Volunteer Soldier\'s decrease cost ability', function() {
            it('should cost 2 if there is tropper friendly unit', () => {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['volunteer-soldier'],
                        groundArena: ['fleet-lieutenant']
                    }
                });
                const { context } = contextRef;

                context.player1.clickCard(context.volunteerSoldier);

                expect(context.player1.exhaustedResourceCount).toBe(2);
            });

            it('should cost 3 if there is no tropper friendly unit', () => {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['volunteer-soldier'],
                        groundArena: ['gentle-giant']
                    }
                });
                const { context } = contextRef;

                context.player1.clickCard(context.volunteerSoldier);

                expect(context.player1.exhaustedResourceCount).toBe(3);
            });
        });
    });
});
