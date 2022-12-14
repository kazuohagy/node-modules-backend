import extractCountryCallingCode from './extractCountryCallingCode'
import metadata from '../../metadata.min.json'

describe('extractCountryCallingCode', () => {
	it('should extract country calling code from a number', () => {
		extractCountryCallingCode('+78005553535', null, null, metadata).should.deep.equal({
			countryCallingCode: '7',
			number: '8005553535'
		})

		extractCountryCallingCode('+7800', null, null, metadata).should.deep.equal({
			countryCallingCode: '7',
			number: '800'
		})

		extractCountryCallingCode('', null, null, metadata).should.deep.equal({})
	})
})
