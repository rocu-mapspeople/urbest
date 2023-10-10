export const createGeoData = async ({ parentId, name, description, coords, issueId }) => {

    console.log('heres my create geodata coordinates');
    console.log(coords);
    const payload = {
        parentId: parentId,
        coordinates: coords,
        name: name,
        description: description,
        externalId: issueId
    };

    const response = await fetch('/createGeoData', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    });

    return {
        status: response.status,
        data: await response.json()
    };
};
