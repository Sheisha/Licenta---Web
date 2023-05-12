const stergeServiciu = (btn) => {
    const serviciuId = btn.parentNode.querySelector('[name=serviciuId]').value;

    const serviciuElement = btn.closest('article');

    fetch('/admin/servicii/' + serviciuId, {
        method: 'DELETE'
    })
        .then( result => {
            return result.json();
        })
        .then(data => {
            console.log(data);
            serviciuElement.parentNode.removeChild(serviciuElement);
        })
        .catch(
            err => console.log(err)
        );
};