# Primary causes assigned by reading these 40 severe errors; categories are tentative.
reviewed_causes = {
    '568466642193104897': ('Domain / implicit disruption', 'Lost-property context; positive words describe desired support and a precious computer.'),
    '569208751972065280': ('Context / uncertain label', 'Tweet is positive literally; linked story would be needed to confirm sarcasm.'),
    '569835633147056128': ('Mixed feelings / positive politeness', 'Praise for people contrasts with a request to change service.'),
    '569215779830280192': ('Mixed feelings / positive politeness', 'Good and kind describe requested behavior rather than a confirmed good experience.'),
    '569608866138173440': ('Mixed feelings / positive politeness', 'Great entertainment and free pricing coexist with repeated app crashes.'),
    '570100214733737985': ('Mixed feelings / positive politeness', 'Polite good-night and thanks follow a complaint about a broken promise.'),
    '569936580883783680': ('Mixed feelings / positive politeness', 'Thanks and hope coexist with feeling duped.'),
    '567755768037130241': ('Mixed feelings / positive politeness', 'Delay complaint includes thanks, great, and cheers.'),
    '570262424038699008': ('Mixed feelings / positive politeness', 'Hope and help mask dissatisfaction and a possible breakup with the airline.'),
    '569759999083171840': ('Sarcasm', 'Love and best are ironic praise of an inconvenient feedback form.'),
    '569514001450672128': ('Sarcasm', 'Nice, love, and awesome sarcastically describe denied boarding and poor staffing.'),
    '570285070184898561': ('Domain / implicit disruption', 'Love and help outweigh an operationally meaningful 43-minute hold.'),
    '567742500366872576': ('Domain / implicit disruption', 'All-day unsuccessful direct messages need conversational context.'),
    '569630987858132992': ('Negation / informal spelling', 'Does not have a good sense has a negative scope over good.'),
    '567786135904980993': ('Context / uncertain label', 'Literal thanks and appreciation; possible disappointment requires thread context.'),
    '568769373122342912': ('Sarcasm', 'Thanks for great service follows being late and a long queue.'),
    '569634729324122112': ('Sarcasm', 'Quoted corporate response ends with nice touch and lol.'),
    '569951438329085952': ('Airline-target mismatch', 'Praise is for Delta while the human label targets American.'),
    '568491765910659072': ('Domain / implicit disruption', 'Desired ease of resolving rewards issues is not actual praise.'),
    '569661509988708352': ('Sarcasm', 'Love being here for two extra days is ironic.'),
    '569682454757257216': ('Negation / informal spelling', 'Never complaints and a failure hashtag counteract compliments.'),
    '570151703410053120': ('Airline-target mismatch', 'Southwest receives praise in a complaint addressed to US Airways.'),
    '569202278298755072': ('Mixed feelings / positive politeness', 'Love for the airline coexists with a poor phone-system comparison.'),
    '569249933271965696': ('Mixed feelings / positive politeness', 'Appreciated help coexists with an excessively long wait.'),
    '569709246150893568': ('Negation / informal spelling', 'DOESNT and an idiomatic profanity express indifference, not approval.'),
    '569698504467021824': ('Sarcasm', 'Excellence in efficiency is ironic after a 45-minute gate wait.'),
    '569704219315318784': ('Sarcasm', 'Thanks and care are ironic criticism of a canned response.'),
    '569930403106172928': ('Sarcasm', 'Lots of fun and thanks describe losing queue position.'),
    '568964010101514240': ('Context / uncertain label', 'Awesome may be ironic or literal; thread context is insufficient.'),
    '569595333899997185': ('Context / uncertain label', 'Supportive literal wording conflicts with the negative label without thread context.'),
    '568326927695491072': ('Mixed feelings / positive politeness', 'Explicit delay is followed by strong genuine praise for the flight.'),
    '568129909408841728': ('Mixed feelings / positive politeness', 'Resolved rebooking and thanks follow a long telephone wait.'),
    '569333553705693184': ('Domain / implicit disruption', 'Hope, nice and clean mask a missing-bag problem.'),
    '569904406285516800': ('Sarcasm', 'Winning a prize is ironic after six delayed flights.'),
    '569907965223763970': ('Sarcasm', 'Thanks criticizes employees and threatens a switch of airline.'),
    '567857402340450305': ('Domain / implicit disruption', 'Promise, like and need mask a missing bag and failed update.'),
    '567791019086065664': ('Sarcasm', 'Love the ice storm is ironic in a repeated delay complaint.'),
    '569978748780421121': ('Airline-target mismatch', 'Negative words target competing airlines; Southwest is missed and wanted.'),
    '568585196699664384': ('Sarcasm', 'Super fun and a smile accompany a broken booking page.'),
    '568790707470790656': ('Sarcasm', 'Great happy Friday follows an extended ground wait and no communication.')
}
assert set(strongest_errors.tweet_id.astype(str)) == set(reviewed_causes)
strongest_errors['reviewed primary cause'] = strongest_errors.tweet_id.map(
    lambda tweet_id: reviewed_causes[str(tweet_id)][0])
strongest_errors['review note'] = strongest_errors.tweet_id.map(
    lambda tweet_id: reviewed_causes[str(tweet_id)][1])
cause_counts = strongest_errors['reviewed primary cause'].value_counts()
display(cause_counts.to_frame('Tweets in reviewed top 40 (not all disagreements)'))
display(strongest_errors[['tweet_id','text','airline_sentiment','vader_compound',
                          'reviewed primary cause','review note']].reset_index(drop=True))
cause_counts.sort_values().plot.barh(figsize=(10,4), color='#9A6FB0')
plt.xlabel('Manually reviewed severe disagreements')
plt.title('Primary causes in the 40 highest-distance disagreements (selected sample)')
plt.tight_layout(); plt.show()
