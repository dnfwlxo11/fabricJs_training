module.exports = {
    selectPosition() {
        const sql = []
        
        sql.push('SELECT ');
        sql.push('* ');
        sql.push('FROM ');
        sql.push('pos');

        return sql.join('');
    },

    updatePosition(params) {
        const sql = []
        
        sql.push('UPDATE ');
        sql.push('pos ');
        sql.push('SET ');
        sql.push('table_position= ');
        sql.push(`'${params}' `);
        sql.push('WHERE ');
        sql.push('id= ');
        sql.push('"position"');

        return sql.join('');
    }
}